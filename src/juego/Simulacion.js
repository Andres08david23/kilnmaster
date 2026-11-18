// Simulación del juego: une el núcleo formal (autómatas, reloj) con las reglas del GDD.
// No depende del motor gráfico: las escenas SOLO leen su estado y le envían solicitudes.
// Todo cambio de estado de una máquina pasa por δ (Automata.ejecutar).
import { Automata } from '../sed/automata.js';
import { Reloj } from '../sed/reloj.js';
import { Aleatorio } from '../sed/aleatorio.js';
import { Lenguaje } from '../sed/lenguaje.js';
import { componer, supervisor } from '../sed/composicion.js';
import { RedPetri } from '../sed/redPetri.js';
import { colorRadar } from '../sed/cobertura.js';
import { Emisor } from './emisor.js';
import { POSICIONES, siguiente } from './circuito.js';
import { SEMILLA, DURACION_TURNO, METAS } from '../config.js';
import vagonJSON from '../sed/modelos/vagon.json' with { type: 'json' };
import maquinaJSON from '../sed/modelos/maquina_simple.json' with { type: 'json' };
import recetaJSON from '../sed/modelos/receta_termica.json' with { type: 'json' };
import especJSON from '../sed/modelos/vagon_especificacion.json' with { type: 'json' };
import redN1JSON from '../sed/modelos/red_n1.json' with { type: 'json' };
import redN2JSON from '../sed/modelos/red_n2.json' with { type: 'json' };

// Tiempos del GDD (sección 7), en segundos de simulación, por turno.
export const TURNO = {
  1: { mediaFalla: 60, cocer: 6 },
  2: { mediaFalla: 45, cocer: 7 },
  3: { mediaFalla: 30, cocer: 8 },
};
export const OPERACION = { molienda: 6, extrusora: 8, cortadora: 5 }; // de iniciar (I) a terminar (T)
export const PAUSA_REINICIO = 1; // s entre terminar e iniciar de nuevo (inicio automático)
// Puntaje del GDD (sección 6), en puntos.
export const PUNTOS = { lote: 100, produccion: 10, quebrado: -50, repararVagon: 30, palabraInvalida: -10, ayuda: -20, intentoBloqueado: -5 };
// Letras de la receta térmica y el evento del vagón que ejecuta cada una.
// Zona del circuito donde se ejecuta cada evento del vagón (corrección de playtest ⚠: un lote exige una vuelta completa).
export const ZONA_EVENTO = { precalentar: ['Z1'], cocer: ['Z2', 'Z3'], enfriar: ['Z4'], descargar: ['R1'] };
export const MAPA_RECETA = { P: 'precalentar', C: 'cocer', E: 'enfriar' };

// Logros del GDD (sección 10), con condición verificable.
export const LOGROS = {
  primerLote: 'Primer lote',
  ceroQuebrados: 'Cero quebrados',
  recetaPerfecta: 'Receta perfecta',
  esquive: 'Esquivé el bloqueo',
  supervisorProbado: 'Supervisor probado',
  turnoFinal: 'Turno final',
};

export class Simulacion extends Emisor {
  constructor({ semilla = SEMILLA, turno = 1, autoIniciar = true, autoReparar = false, supervisor: conSupervisor = true, logros = new Set(), zonas = false } = {}) {
    super();
    this.turno = turno;
    this.params = TURNO[turno];
    this.autoIniciar = autoIniciar;
    this.zonas = zonas; // true en el juego: cada evento del vagón solo se ejecuta en su zona
    this.autoReparar = autoReparar; // solo para pruebas y demostraciones: en el juego repara el jugador
    this.reloj = new Reloj();
    this.az = new Aleatorio(semilla);
    this.registro = []; // bitácora de eventos ejecutados
    this.puntos = 0;
    this.meta = METAS[turno];
    this.logros = logros; // conjunto compartido entre turnos
    this.terminado = false;
    this.estadisticas = { quebrados: 0, fallasReparadas: 0 };
    // Supervisor de secuencia del vagón: el estado prohibido es Quebrado. En modo manual se apaga.
    this.supervisorActivo = conSupervisor;
    this.supervisorVagon = supervisor(vagonJSON, ['Quebrado']);
    this.composicion = componer(vagonJSON, especJSON); // G1 ‖ G2: vagón con su especificación
    this.intentosBloqueados = 0;
    this.lenguaje = new Lenguaje(recetaJSON);
    this.maquinas = new Map();
    for (const id of ['molienda', 'extrusora', 'cortadora']) {
      this.maquinas.set(id, { id, tipo: 'maquina', automata: new Automata({ ...maquinaJSON, nombre: id }), duracion: OPERACION[id], terminados: 0 });
    }
    this.vagones = [];
    for (let i = 1; i <= 5; i++) {
      this.vagones.push({ id: `vagon${i}`, tipo: 'vagon', automata: new Automata({ ...vagonJSON, nombre: `vagon${i}` }) });
    }
    // Red de Petri del circuito: los vagones siguen a los tokens. N2 (con el lugar Cupo) si el supervisor está activo.
    // Posición inicial: vagon1..vagon5 en Z1, Z2, Z3, Z4 y R1 (marcado M0).
    this.posicion = new Map();
    this.vagones.forEach((v, i) => this.posicion.set(v.id, POSICIONES[i]));
    this.red = new RedPetri(conSupervisor ? redN2JSON : redN1JSON);
    this.verde = this._copiaEstadoRed(); // último marcado "verde" (para reintentar tras un deadlock)
    this.colorPrevio = this.colorRadar();
    this.bloqueada = null; // se llena con { marcado, secuencia } al llegar a un deadlock
    this.reloj.manejador = (ev, t) => this._atender(ev, t);
  }

  // ---- Red de Petri: tokens y disparos ----
  // Vagón que ocupa una posición del circuito (o null).
  vagonEn(pos) {
    for (const [id, p] of this.posicion) if (p === pos) return this.entidad(id);
    return null;
  }

  // Disparo pedido por el jugador. nombre: 't_avanzar_Z1'... o 't_agregar_vagon'.
  // Devuelve { ok, razon, mover }. Solo el núcleo (RedPetri) cambia el marcado.
  solicitarTransicion(nombre) {
    if (this.bloqueada) return { ok: false, razon: 'el circuito está bloqueado (deadlock)' };
    if (nombre === 't_agregar_vagon' && this.supervisorActivo) {
      // N2: el lugar Cupo (M = 0) nunca tiene token; el supervisor lo explica y el intento cuesta puntos.
      const razon = this.motivoAgregar();
      this.intentosBloqueados++;
      this._logro('supervisorProbado');
      this.sumar(PUNTOS.intentoBloqueado, 'intento bloqueado');
      this.emit('transicionBloqueada', { transicion: nombre, razon, supervisor: true });
      return { ok: false, bloqueado: true, razon };
    }
    if (!this.red.habilitada(nombre)) {
      const m = this.red.motivoBloqueo(nombre);
      let razon = `${nombre} no está habilitada`;
      if (m) razon = m.tipo === 'falta_token' ? `falta un token en ${m.lugar}` : `capacidad k = 1 de ${m.lugar}`;
      this.emit('transicionBloqueada', { transicion: nombre, razon, motivo: m });
      return { ok: false, razon, motivo: m };
    }
    const antes = [...this.red.M];
    const hab = this.red.conflictos();
    this.red.disparar(nombre);
    let mov = null;
    if (nombre === 't_agregar_vagon') {
      const id = `vagon${this.vagones.length + 1}`;
      const v = { id, tipo: 'vagon', automata: new Automata({ ...vagonJSON, nombre: id }) };
      this.vagones.push(v);
      this.posicion.set(id, 'R1');
      mov = { id, de: 'patio', a: 'R1', nuevo: true };
    } else {
      const de = nombre.replace('t_avanzar_', '');
      const v = this.vagonEn(de);
      const a = siguiente(de);
      this.posicion.set(v.id, a);
      mov = { id: v.id, de, a };
    }
    const info = { transicion: nombre, antes, despues: [...this.red.M], conflictos: hab, ...mov };
    this.emit('ficha', info);
    this._despuesDeFicha();
    if (this.red.esMuerto()) this._deadlock();
    return { ok: true, ...info };
  }

  _despuesDeFicha() {
    const color = this.colorRadar();
    if (color === 'verde') this.verde = this._copiaEstadoRed();
    // Logro "Esquivé el bloqueo": el radar pasa de amarillo a verde sin llegar a rojo
    if (!this.supervisorActivo && this.colorPrevio === 'amarillo' && color === 'verde') {
      this.esquivados = (this.esquivados || 0) + 1;
      this._logro('esquive');
    }
    this.colorPrevio = color;
    this.emit('radar', color);
  }

  // Disparo de t_agregar_vagon bloqueado por el supervisor (lugar Cupo): descuenta puntos como un intento bloqueado.
  motivoAgregar() {
    return 'Cupo = 0: vagones ≤ posiciones − 1';
  }

  // ---- Radar del Árbol de Cobertura y reintento ----
  // Color del radar con la regla de habilitación vigente (N1 o N2), explorando 3 disparos.
  colorRadar() { return colorRadar(this.red, this.red.M, 3); }

  _copiaEstadoRed() {
    return { M: [...this.red.M], pos: [...this.posicion], vagones: this.vagones.length, supervisor: this.supervisorActivo };
  }

  // Ecuación de estado sin aplicar el disparo: M_k = M_{k-1} + Aᵀ · u_k (para el Inspector, "Probar disparo").
  probarDisparo(nombre) {
    const r = this.red, i = r.indiceT(nombre);
    const u = r.transiciones.map((_, j) => (j === i ? 1 : 0));
    const ATu = r.M.map((_, p) => r.A[i][p]);
    const Mk = r.siguienteMarcado(r.M, i);
    const habilitada = r.habilitada(i);
    const motivo = habilitada ? null : r.motivoBloqueo(i);
    return { transicion: r.transiciones[i].nombre, u, ATu, Mk, Mk1: [...r.M], habilitada, motivo, color: colorRadar(r, Mk, 3) };
  }

  // Vuelve al último marcado verde (o, si activa=true, además enciende el supervisor) y reanuda el reloj.
  reintentar(activarSupervisor = false) {
    const v = this.verde;
    this.vagones.length = v.vagones;
    this.posicion = new Map(v.pos);
    this.red = new RedPetri(v.supervisor ? redN2JSON : redN1JSON);
    this.red.reiniciar(v.M);
    this.supervisorActivo = v.supervisor;
    this.bloqueada = null;
    this.emit('reintento', this._copiaEstadoRed());
    if (activarSupervisor) this.setSupervisor(true);
    this.emit('radar', this.colorRadar());
    this.reloj.reanudar();
  }

  _deadlock() {
    const secuencia = this.red.historial.map((h) => h.transicion);
    this.bloqueada = { marcado: this.red.marcado(), secuencia };
    this.reloj.pausar();
    this.emit('deadlock', this.bloqueada);
  }

  // Marcado actual en una estructura legible: { lugar: tokens }.
  marcado() { return this.red.marcado(); }

  // Eventos controlables que el supervisor deshabilita para esa entidad en su estado actual:
  // lista de { evento, razon }. Se completa en el paso del supervisor.
  deshabilitados(id) {
    const e = this.entidad(id);
    if (!this.supervisorActivo || !e || e.tipo !== 'vagon') return [];
    return this.supervisorVagon.deshabilitados.get(e.automata.estado) || [];
  }

  // Razón por la que un evento del vagón no se puede ejecutar en su posición actual (o null si sí).
  fueraDeZona(id, evento) {
    const e = this.entidad(id);
    if (!this.zonas || !e || e.tipo !== 'vagon' || !ZONA_EVENTO[evento]) return null;
    const pos = this.posicion.get(id);
    if (ZONA_EVENTO[evento].includes(pos)) return null;
    return `${evento} se ejecuta en ${ZONA_EVENTO[evento].join(' o ')} (el vagón está en ${pos})`;
  }

  setSupervisor(activo) {
    activo = !!activo;
    if (activo !== this.supervisorActivo) {
      // N1 y N2 comparten los 13 primeros lugares; Cupo (último de N2) vale 0 en M0.
      const M = this.red.M.slice(0, 13);
      this.red = new RedPetri(activo ? redN2JSON : redN1JSON);
      this.red.reiniciar(activo ? [...M, 0] : M);
      this.supervisorActivo = activo;
      if (this.colorRadar() === 'verde') this.verde = this._copiaEstadoRed();
      this.emit('radar', this.colorRadar());
    }
    this.supervisorActivo = activo;
    this.emit('supervisor', this.supervisorActivo);
  }

  // Estado de la composición G1 ‖ G2 para un vagón (con el supervisor activo los dos van sincronizados).
  estadoComposicion(id) {
    return this.estadoCompuesto(id);
  }

  estadoCompuesto(id) {
    const e = this.entidad(id);
    return `${e.automata.estado}|${e.automata.estado}`;
  }

  entidad(id) {
    return this.maquinas.get(id) || this.vagones.find((v) => v.id === id) || null;
  }

  // Arranca la planta: las máquinas empiezan su primer ciclo.
  iniciar() {
    if (this.autoIniciar) {
      let k = 0;
      for (const m of this.maquinas.values()) this.reloj.programarEn(0.5 + 0.5 * k++, { tipo: 'iniciar', id: m.id });
    }
  }

  avanzar(dt) {
    const r = this.reloj.avanzar(dt);
    if (!this.terminado && this.reloj.ahora >= DURACION_TURNO) this._terminarTurno();
    return r;
  }

  // Fin del turno: compara los puntos con la meta y calcula los logros que dependen del turno completo.
  _terminarTurno() {
    this.terminado = true;
    const exito = this.puntos >= this.meta && !this.bloqueada;
    if (this.estadisticas.quebrados === 0) this._logro('ceroQuebrados');
    if (this.turno === 3 && exito) this._logro('turnoFinal');
    const produccion = [...this.maquinas.values()].reduce((a, m) => a + m.terminados, 0);
    this.emit('finTurno', {
      turno: this.turno, puntos: this.puntos, meta: this.meta, exito,
      produccion, fallasReparadas: this.estadisticas.fallasReparadas, intentosBloqueados: this.intentosBloqueados,
      quebrados: this.estadisticas.quebrados, deadlocksEvitados: this.esquivados || 0, logros: [...this.logros],
    });
  }

  _logro(clave) {
    if (this.logros.has(clave)) return;
    this.logros.add(clave);
    this.emit('logro', { clave, nombre: LOGROS[clave] });
  }

  // Solicitud del jugador (o del inicio automático): ejecutar un evento controlable en una entidad.
  // Devuelve { ok, razon }. Nunca cambia el estado directamente: pasa por δ.
  solicitar(id, evento) {
    const e = this.entidad(id);
    if (!e) return { ok: false, razon: 'entidad desconocida' };
    if (!e.automata.puede(evento)) {
      return { ok: false, razon: `δ(${e.automata.estado}, ${evento}) no está definida` };
    }
    if (!e.automata.esControlable(evento)) return { ok: false, razon: `${evento} no es controlable` };
    const zona = this.fueraDeZona(id, evento);
    if (zona) return { ok: false, razon: zona };
    const bloqueo = this.deshabilitados(id).find((d) => d.evento === evento);
    if (bloqueo) {
      // El supervisor impide el evento: no se ejecuta, se registra el intento y se descuentan puntos.
      this.intentosBloqueados++;
      this._logro('supervisorProbado');
      this.sumar(PUNTOS.intentoBloqueado, 'intento bloqueado');
      this.emit('intentoBloqueado', { id, evento, razon: bloqueo.razon });
      return { ok: false, bloqueado: true, razon: bloqueo.razon };
    }
    if (e.tipo === 'vagon' && (evento === 'cocer' || evento === 'enfriar') && this.reloj.ahora < (e.ocupadoHasta || 0)) {
      // Un ciclo de cocción C dura 6, 7 u 8 s según el turno (GDD, sección 7): hasta que termina no se enfría ni se vuelve a cocer.
      const faltan = (e.ocupadoHasta - this.reloj.ahora).toFixed(1);
      return { ok: false, razon: `cocción en curso: faltan ${faltan} s` };
    }
    if (e.tipo === 'vagon' && evento === 'limpiar_vagon') {
      return { ok: false, razon: 'limpiar_vagon solo se ejecuta desde la consola de reparación (palabra de L)' };
    }
    this._ejecutar(e, evento, true);
    if (e.tipo === 'vagon' && evento === 'cocer' && e.automata.estado === 'Cocido') e.ocupadoHasta = this.reloj.ahora + this.params.cocer;
    return { ok: true };
  }

  sumar(delta, motivo) {
    this.puntos += delta;
    this.emit('puntos', { delta, motivo, total: this.puntos });
  }

  _ejecutar(e, evento, porJugador = false) {
    const de = e.automata.estado;
    const a = e.automata.ejecutar(evento);
    const reg = { t: this.reloj.ahora, entidad: e.id, evento, de, a, porJugador };
    this.registro.push(reg);
    this.emit('cambio', e, reg);
    if (e.tipo === 'vagon') {
      if (a === 'Quebrado') { e.intentosReparacion = 0; this.estadisticas.quebrados++; this.sumar(PUNTOS.quebrado, 'vagón quebrado'); this.emit('alerta', { tipo: 'quebrado', id: e.id }); }
      if (evento === 'descargar') { this._logro('primerLote'); e.lotes = (e.lotes || 0) + 1; this.sumar(PUNTOS.lote, 'lote completado'); this.emit('lote', e); }
    }
    if (e.tipo === 'maquina') this._despuesDeMaquina(e, evento);
    return reg;
  }

  // Programación de las consecuencias en el reloj (duraciones y eventos no controlables con la semilla).
  _despuesDeMaquina(m, evento) {
    if (evento === 'iniciar') {
      const tFalla = this.az.exponencial(this.params.mediaFalla);
      if (tFalla < m.duracion) this.reloj.programarEn(tFalla, { tipo: 'fallar', id: m.id });
      else this.reloj.programarEn(m.duracion, { tipo: 'terminar', id: m.id });
    } else if (evento === 'terminar') {
      m.terminados++;
      this.sumar(PUNTOS.produccion, `${m.id} terminó`);
      this.emit('produccion', m);
      if (this.autoIniciar) this.reloj.programarEn(PAUSA_REINICIO, { tipo: 'iniciar', id: m.id });
    } else if (evento === 'fallar') {
      this.emit('alerta', { tipo: 'falla', id: m.id });
      if (this.autoReparar) this.reloj.programarEn(8, { tipo: 'reparar', id: m.id });
    } else if (evento === 'reparar') {
      this.estadisticas.fallasReparadas++;
      if (this.autoIniciar) this.reloj.programarEn(PAUSA_REINICIO, { tipo: 'iniciar', id: m.id });
    }
  }

  // Consola de reparación: el jugador escribe una palabra w de la receta térmica. Si w ∈ L se ejecutan, cada uno
  // por δ, limpiar_vagon y los eventos de w; el vagón queda en Enfriado. Si w ∉ L el vagón sigue Quebrado.
  repararVagon(id, palabra) {
    const e = this.entidad(id);
    if (!e || e.tipo !== 'vagon') return { ok: false, razon: 'no es un vagón' };
    if (e.automata.estado !== 'Quebrado') return { ok: false, razon: 'el vagón no está quebrado' };
    const r = this.lenguaje.evaluar(palabra);
    if (!r.pertenece) {
      e.intentosReparacion = (e.intentosReparacion || 0) + 1;
      this.sumar(PUNTOS.palabraInvalida, 'palabra inválida');
      const res = { ok: false, razon: `la palabra "${palabra}" no pertenece a L`, evaluacion: r };
      this.emit('reparacion', { id, palabra, ...res });
      return res;
    }
    this._ejecutar(e, 'limpiar_vagon', true);
    for (const c of palabra) this._ejecutar(e, MAPA_RECETA[c], true);
    this.sumar(PUNTOS.repararVagon, 'vagón reparado');
    if (!e.intentosReparacion) this._logro('recetaPerfecta'); // primer intento
    const res = { ok: true, evaluacion: r };
    this.emit('reparacion', { id, palabra, ...res });
    return res;
  }

  // Ayuda de la consola: muestra la expresión regular de la ficha y cuesta puntos.
  pedirAyuda() {
    this.sumar(PUNTOS.ayuda, 'ayuda de la consola');
    return this.lenguaje.dfa.expresion;
  }

  nuevoLenguaje() {
    return new Lenguaje(recetaJSON);
  }

  _atender(ev, t) {
    const e = this.entidad(ev.id);
    if (!e || !e.automata.puede(ev.tipo)) return; // el estado cambió y el evento ya no aplica
    this._ejecutar(e, ev.tipo, false);
  }
}
