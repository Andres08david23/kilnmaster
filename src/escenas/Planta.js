// Escena de la planta: planta isométrica con máquinas, horno de 4 zonas y vagones sobre el circuito.
// REGLA: update solo avanza el reloj de la simulación y dibuja. Esta escena nunca cambia estados ni recursos:
// los lee de la Simulación y le envía solicitudes.
import { ANCHO, ALTO, COLUMNAS, FILAS, VELOCIDADES, SEMILLA, TURNOS } from '../config.js';
import { Sonido } from '../audio/sonido.js';
import { Simulacion } from '../juego/Simulacion.js';
import { POSICIONES, CELDA, CELDA_PATIO, RIELES, CELDAS_MAQUINA, TEMPERATURA_ZONA } from '../juego/circuito.js';
import { aPantalla } from '../iso/proyeccion.js';
import { GestorEntrada } from '../entrada/gestorEntrada.js';
import { VistaEntidad } from '../entidades/VistaEntidad.js';
import { dibujarSuelo, dibujarMuro, dibujarRiel } from '../arte/planta.js';
import { dibujarMolienda, dibujarExtrusora, dibujarCortadora, dibujarZonaHorno, dibujarVagon } from '../arte/maquinas.js';
import { PALETA, colorTermico } from '../arte/paleta.js';
import { Radar } from '../arte/radar.js';

const ORIGEN = { x: ANCHO / 2, y: 120 }; // posición en pantalla de la celda (0, 0)
const DIBUJO = { molienda: dibujarMolienda, extrusora: dibujarExtrusora, cortadora: dibujarCortadora };

export class Planta extends Phaser.Scene {
  constructor() { super('Planta'); }

  init(datos) { this.turno = (datos && datos.turno) || 1; }

  create() {
    // Los logros se conservan entre turnos y el sonido es uno solo para toda la partida.
    if (!this.registry.get('logros')) this.registry.set('logros', new Set());
    if (!this.registry.get('sonido')) this.registry.set('sonido', new Sonido());
    this.sonido = this.registry.get('sonido');
    this.sim = new Simulacion({ semilla: SEMILLA, turno: this.turno, logros: this.registry.get('logros'), zonas: true });
    this.gestor = new GestorEntrada();
    this.gestor.conectarTeclado(this);
    this.registry.set('sim', this.sim);
    this.registry.set('gestor', this.gestor);
    this.reloj = this.sim.reloj;

    this.add.rectangle(ANCHO / 2, ALTO / 2, ANCHO, ALTO, PALETA.fondo).setDepth(-5000);
    dibujarSuelo(this, COLUMNAS, FILAS, ORIGEN.x, ORIGEN.y);
    for (let i = 0; i < COLUMNAS; i++) dibujarMuro(this, i, 0, ORIGEN.x, ORIGEN.y);
    for (let j = 1; j < FILAS; j++) dibujarMuro(this, 0, j, ORIGEN.x, ORIGEN.y);
    for (const [x, y, eje] of RIELES) dibujarRiel(this, x, y, ORIGEN.x, ORIGEN.y, eje);

    // Zonas del horno (decorativas; su temperatura se anima en la fase de pulido)
    this.zonas = {};
    for (const p of POSICIONES.slice(0, 4)) {
      const [x, y] = CELDA[p];
      const pos = aPantalla(x, y);
      this.zonas[p] = dibujarZonaHorno(this, x, y, TEMPERATURA_ZONA[p], { x: pos.x + ORIGEN.x, y: pos.y + ORIGEN.y });
      this.zonas[p].setDepth(x + y - 0.3);
      this.zonas[p]._pos = { x: pos.x + ORIGEN.x, y: pos.y + ORIGEN.y };
      this.temperatura = this.temperatura || {};
      this.temperatura[p] = { actual: TEMPERATURA_ZONA[p], cubeta: -1 };
    }
    this.crearHalo();

    // Vistas de las máquinas y de los vagones. Cada una refleja el autómata de su entidad.
    this.vistas = new Map();
    for (const [id, m] of this.sim.maquinas) {
      this.vistas.set(id, new VistaEntidad(this, m, CELDAS_MAQUINA[id], ORIGEN, DIBUJO[id], this.gestor));
    }
    // Los vagones siguen a los tokens de la red de Petri (Simulacion.posicion).
    this.sim.vagones.forEach((v) => {
      this.vistas.set(v.id, new VistaEntidad(this, v, CELDA[this.sim.posicion.get(v.id)], ORIGEN, dibujarVagon, this.gestor));
    });
    this.sim.on('cambio', (e) => { const v = this.vistas.get(e.id); if (v) v.redibujar(); });
    this.crearPatio();
    this.marcas = this.add.graphics().setDepth(-900);
    this.panelRed = this.add.text(8, ALTO - 8, '', { fontFamily: 'monospace', fontSize: '11px', color: '#cfd3d8', backgroundColor: '#000000aa', padding: { x: 6, y: 4 }, lineSpacing: 2 }).setOrigin(0, 1).setDepth(9000);
    this.sim.on('ficha', (f) => this.alFicha(f));
    this.sim.on('transicionBloqueada', (d) => {
      if (d.supervisor) this.cameras.main.shake(220, 0.006);
      this.alertar(`✕ ${d.transicion}: ${d.razon}`);
    });
    this.sim.on('deadlock', (d) => this.mostrarDeadlock(d));
    this.gestor.on('solicitarTransicion', (t) => {
      const r = this.sim.solicitarTransicion(t);
      this.sim.emit('respuestaTransicion', { transicion: t, ...r });
    });
    this.dibujarMarcas();
    // Radar del Árbol de Cobertura (arriba a la derecha): se recalcula en cada disparo con la regla de habilitación vigente.
    this.radar = new Radar(this, ANCHO - 44, 44);
    this.radar.g.setDepth(9000);
    this.add.text(ANCHO - 44, 82, 'Radar', { fontFamily: 'monospace', fontSize: '10px', color: '#cfd3d8' }).setOrigin(0.5).setDepth(9000);
    this.sim.on('radar', (c) => this.radar.set(c));
    this.radar.set(this.sim.colorRadar());
    this.sim.on('reintento', () => this.alReintento());
    this.sim.on('alerta', (a) => this.alertar(a.tipo === 'falla' ? `⚠ ${a.id} en Falla: ejecuta reparar (R)` : `⚠ ${a.id} QUEBRADO: abre su HUD y repara con la receta`));

    // Acciones comunes de entrada
    this.gestor.on('pausa', () => this.reloj.alternarPausa());
    this.gestor.on('velocidad', (v) => { if (VELOCIDADES.includes(v)) this.reloj.setVelocidad(v); });
    this.gestor.on('seleccionar', (id) => this.abrirHUD(id));
    this.gestor.on('solicitarEvento', (id, ev) => {
      const r = this.sim.solicitar(id, ev);
      this.sim.emit('respuesta', { id, evento: ev, ...r });
    });
    this.gestor.on('inspector', () => this.abrirInspector());
    this.gestor.on('supervisor', () => this.sim.setSupervisor(!this.sim.supervisorActivo));
    this.gestor.on('cerrar', () => this.cerrarSuperpuestas());

    // Contador de fps y tiempo de simulación (F1)
    this.info = this.add.text(8, 118, '', { fontFamily: 'monospace', fontSize: '13px', color: '#ffffff', backgroundColor: '#000000aa' })
      .setDepth(10000).setVisible(false);
    this.input.keyboard.addKey('F1').on('down', () => this.info.setVisible(!this.info.visible));
    this.input.keyboard.addCapture('F1');

    this.alertas = [];
    // Botón del supervisor (tecla M): activo = eventos peligrosos deshabilitados; manual = el jugador puede forzarlos.
    this.btnSup = this.add.rectangle(8, 64, 190, 26, 0x2e9e5b).setOrigin(0, 0.5).setDepth(9000).setInteractive({ useHandCursor: true });
    this.txtSup = this.add.text(103, 64, '', { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' }).setOrigin(0.5).setDepth(9001);
    this.btnSup.on('pointerdown', () => this.gestor.supervisor());
    const pintarSup = () => {
      const on = this.sim.supervisorActivo;
      this.btnSup.setFillStyle(on ? 0x2e9e5b : 0xa07a1a);
      this.txtSup.setText(on ? 'Supervisor: ACTIVO [M]' : 'Modo MANUAL [M]');
    };
    this.sim.on('supervisor', () => { pintarSup(); this.dibujarMarcas(); });
    pintarSup();
    // Intento de forzar un evento deshabilitado: la cámara tiembla y se avisa (los puntos ya se descontaron).
    this.sim.on('intentoBloqueado', (d) => {
      this.cameras.main.shake(220, 0.006);
      this.alertar(`✕ Supervisor: ${d.evento} bloqueado en ${d.id} (−5 puntos)`);
    });
    this.crearHUDPartida();
    this.crearPulido();
    this.conectarSonido();
    this.sim.on('finTurno', (d) => this.alTerminarTurno(d));
    this.sim.iniciar();
  }

  // ---- Pulido: brillo térmico, partículas, cámara y transiciones ----
  crearPulido() {
    // Cámaras: la principal es el mundo (arrastre y zoom) y otra, fija, dibuja el HUD (objetos con depth ≥ 9000).
    this.camMundo = this.cameras.main;
    this.camUI = this.cameras.add(0, 0, ANCHO, ALTO);
    this._hijos = 0;
    this.clasificar();
    this.camMundo.fadeIn(350, 28, 26, 30);
    // Arrastre con el mouse o un dedo, rueda del mouse y pellizco con dos dedos
    this.input.addPointer(2);
    let previo = null;
    this.input.on('pointermove', (p) => {
      const dos = this.input.pointer1.isDown && this.input.pointer2.isDown;
      if (dos) {
        const d = Phaser.Math.Distance.Between(this.input.pointer1.x, this.input.pointer1.y, this.input.pointer2.x, this.input.pointer2.y);
        if (previo) this.zoom(this.camMundo.zoom * (d / previo));
        previo = d;
        return;
      }
      previo = null;
      if (p.isDown && p.getDistance() > 8) {
        this.camMundo.scrollX -= (p.x - p.prevPosition.x) / this.camMundo.zoom;
        this.camMundo.scrollY -= (p.y - p.prevPosition.y) / this.camMundo.zoom;
      }
    });
    this.input.on('pointerup', () => { previo = null; });
    this.input.on('wheel', (p, objs, dx, dy) => this.zoom(this.camMundo.zoom * (dy > 0 ? 0.9 : 1.1)));
    // Partículas: una textura de punto y un emisor por efecto
    const gt = this.make.graphics({ x: 0, y: 0, add: false });
    gt.fillStyle(0xffffff, 1); gt.fillCircle(4, 4, 4); gt.generateTexture('punto', 8, 8); gt.destroy();
    const mk = (cfg) => { try { return this.add.particles(0, 0, 'punto', { emitting: false, ...cfg }).setDepth(5000); } catch (e) { return null; } };
    this.fxChispas = mk({ lifespan: 700, speed: { min: 40, max: 110 }, scale: { start: 0.7, end: 0 }, tint: [0xffd34a, 0xff7a1a], gravityY: 120 });
    this.fxHumo = mk({ lifespan: 1400, speedY: { min: -26, max: -14 }, speedX: { min: -6, max: 6 }, scale: { start: 0.5, end: 1.3 }, alpha: { start: 0.35, end: 0 }, tint: 0x9aa3ad });
    this.fxRoto = mk({ lifespan: 600, speed: { min: 60, max: 150 }, scale: { start: 0.8, end: 0 }, tint: [0xd64545, 0x8a5a3a], gravityY: 200 });
    const en = (id) => { const v = this.vistas.get(id); return v ? v.pos : null; };
    this.sim.on('lote', (e) => { const q = en(e.id); if (q && this.fxChispas) this.fxChispas.explode(18, q.x, q.y - 20); });
    this.sim.on('alerta', (a) => { const q = en(a.id); if (q && this.fxRoto) this.fxRoto.explode(a.tipo === 'quebrado' ? 22 : 10, q.x, q.y - 20); });
    this.sim.on('cambio', (e, reg) => {
      if (e.tipo === 'maquina' && reg.evento === 'iniciar') this.humo(e.id, 6);
    });
    this.time.addEvent({ delay: 900, loop: true, callback: () => {
      for (const m of this.sim.maquinas.values()) if (m.automata.estado === 'Operando') this.humo(m.id, 1);
    } });
    // Temperatura de las zonas: sube cuando hay un vagón y baja cuando está vacía
    this.time.addEvent({ delay: 300, loop: true, callback: () => this.actualizarTemperaturas() });
  }

  humo(id, n) {
    const v = this.vistas.get(id);
    if (v && this.fxHumo) this.fxHumo.explode(n, v.pos.x, v.pos.y - 34);
  }

  zoom(z) { this.camMundo.setZoom(Phaser.Math.Clamp(z, 0.6, 2)); }

  // Clasifica cada objeto: HUD (depth ≥ 9000) lo dibuja solo la cámara fija; el resto, solo la del mundo.
  clasificar() {
    for (const o of this.children.list) {
      if (o._cam) continue;
      o._cam = true;
      if (o.depth >= 9000) this.camMundo.ignore(o); else this.camUI.ignore(o);
    }
    this._hijos = this.children.list.length;
  }

  // Brillo del horno: UN solo objeto con el filtro Glow de Phaser 4 (un filtro por zona costaba demasiado).
  // Dibuja un rombo por zona con su color térmico; el glow lo hace resplandecer.
  crearHalo() {
    this.halo = this.add.graphics().setDepth(-500);
    try {
      if (this.halo.enableFilters) this.halo.enableFilters();
      this.halo.filters && this.halo.filters.internal && this.halo.filters.internal.addGlow(0xffffff, 2, 0, 1, false, 3, 6);
    } catch (e) { /* sin filtros: queda el color térmico de las bocas */ }
    this.pintarHalo();
    this._vigilia = { t0: performance.now(), frames: 0, muestras: 0 };
  }

  // Control de 60 fps con el reloj real: si en dos mediciones seguidas (2,5 s) no hay 40 fps, se apaga el filtro del halo.
  vigilarFps() {
    const v = this._vigilia;
    if (!v || this.haloApagado || this.reloj.pausado) return;
    v.frames++;
    const dt = performance.now() - v.t0;
    if (dt < 2500) return;
    const fps = (v.frames * 1000) / dt;
    v.t0 = performance.now(); v.frames = 0;
    v.muestras = fps < 40 ? v.muestras + 1 : 0;
    if (v.muestras >= 2) {
      // Sin filtro: se recrea el halo como un gráfico plano de mezcla aditiva (sin pasadas extra de GPU)
      this.halo.destroy();
      this.halo = this.add.graphics().setDepth(-500).setBlendMode(Phaser.BlendModes.ADD);
      this.camUI.ignore(this.halo); this.halo._cam = true;
      this.haloApagado = true;
      this.pintarHalo();
    }
  }

  pintarHalo() {
    this.halo.clear();
    for (const p of POSICIONES.slice(0, 4)) {
      const c = this.zonas[p]._colorTermico;
      const { x, y } = this.zonas[p]._pos;
      this.halo.fillStyle(c, this.haloApagado ? 0.3 : 0.55);
      this.halo.fillPoints([{ x: x - 15, y: y + 4 }, { x: x - 4, y: y + 9 }, { x: x - 4, y: y - 9 }, { x: x - 15, y: y - 16 }], true);
    }
  }

  actualizarTemperaturas() {
    for (const p of POSICIONES.slice(0, 4)) {
      const t = this.temperatura[p];
      const objetivo = TEMPERATURA_ZONA[p] + (this.sim.vagonEn(p) ? 0.15 : -0.05);
      t.actual += (Phaser.Math.Clamp(objetivo, 0, 1) - t.actual) * 0.25;
      const cubeta = Math.round(t.actual * 10); // el color cambia en 10 escalones
      if (cubeta !== t.cubeta) {
        t.cubeta = cubeta;
        const vieja = this.zonas[p];
        const [x, y] = CELDA[p];
        this.zonas[p] = dibujarZonaHorno(this, x, y, cubeta / 10, vieja._pos);
        this.zonas[p]._pos = vieja._pos;
        this.zonas[p].setDepth(x + y - 0.3);
        vieja.destroy();
        this.pintarHalo();
        this.camUI.ignore(this.zonas[p]);
        this.zonas[p]._cam = true;
      }
    }
  }

  // ---- HUD de partida (GDD, sección 9) ----
  crearHUDPartida() {
    const f = (px, color = '#ffffff') => ({ fontFamily: 'monospace', fontSize: `${px}px`, color });
    // Arriba izquierda: reloj de simulación y turno
    this.txtReloj = this.add.text(8, 8, '', { ...f(14), backgroundColor: '#000000aa', padding: { x: 6, y: 3 } }).setDepth(9000);
    // Arriba centro: puntaje y meta
    this.txtPuntos = this.add.text(ANCHO / 2, 10, '', { ...f(20, '#ffd34a'), backgroundColor: '#000000aa', padding: { x: 8, y: 3 } }).setOrigin(0.5, 0).setDepth(9000);
    this.sim.on('puntos', () => this.pintarPuntos());
    this.pintarPuntos();
    // Botones táctiles equivalentes a las teclas: pausa, inspector, velocidad, sonido
    const boton = (x, texto, fn) => {
      const r = this.add.rectangle(x, 92, 56, 24, PALETA.metal, 0.85).setOrigin(0, 0.5).setDepth(9000).setInteractive({ useHandCursor: true });
      const t = this.add.text(x + 28, 92, texto, f(11)).setOrigin(0.5).setDepth(9001);
      r.on('pointerdown', fn);
      return t;
    };
    this.btnPausa = boton(8, 'P Pausa', () => this.gestor.pausa());
    boton(68, 'I Inspec', () => this.gestor.inspector());
    boton(128, '×1', () => this.gestor.velocidad(1));
    boton(188, '×2', () => this.gestor.velocidad(2));
    boton(248, '×4', () => this.gestor.velocidad(4));
    this.btnSonido = boton(308, 'Sonido', () => { this.sonido.alternar(); this.btnSonido.setText(this.sonido.silencio ? 'Mudo' : 'Sonido'); });
    this.gestor.on('pausa', () => this.btnPausa.setText(this.reloj.pausado ? 'P Seguir' : 'P Pausa'));
    // Logros: aviso dorado al desbloquearlos
    this.sim.on('logro', (l) => {
      const t = this.add.text(ANCHO / 2, 70, `★ Logro: ${l.nombre}`, { ...f(16, '#1c1a1e'), backgroundColor: '#ffd34a', padding: { x: 10, y: 5 } }).setOrigin(0.5).setDepth(9500);
      this.tweens.add({ targets: t, y: 60, alpha: 0, delay: 2200, duration: 700, onComplete: () => t.destroy() });
    });
  }

  pintarPuntos() {
    this.txtPuntos.setText(`${this.sim.puntos} / ${this.sim.meta} pts`);
  }

  conectarSonido() {
    const s = this.sonido, sim = this.sim;
    sim.on('ficha', () => s.avance());
    sim.on('transicionBloqueada', () => s.bloqueado());
    sim.on('intentoBloqueado', () => s.bloqueado());
    sim.on('produccion', () => s.produccion());
    sim.on('lote', () => s.lote());
    sim.on('alerta', (a) => (a.tipo === 'quebrado' ? s.quebrado() : s.falla()));
    sim.on('logro', () => s.logro());
    sim.on('deadlock', () => s.deadlock());
    this.input.on('pointerdown', () => s.clic());
  }

  // Fin del turno: pasa a la pantalla de resultados con los datos del turno.
  alTerminarTurno(d) {
    this.reloj.pausar();
    if (d.turno === TURNOS && d.exito) this.sonido.victoria();
    this.camMundo.fadeOut(500, 28, 26, 30);
    this.time.delayedCall(600, () => {
      this.cerrarSuperpuestas();
      this.scene.start('Resultados', d);
    });
  }


  // Patio: el vagón nuevo espera aquí. Clic = t_agregar_vagon (el supervisor puede impedirlo).
  crearPatio() {
    const p = aPantalla(CELDA_PATIO[0], CELDA_PATIO[1]);
    this.patioPos = { x: p.x + ORIGEN.x, y: p.y + ORIGEN.y };
    this.patio = dibujarVagon(this, CELDA_PATIO[0], CELDA_PATIO[1], 'Crudo', this.patioPos);
    this.patioTxt = this.add.text(this.patioPos.x, this.patioPos.y + 26, 'Patio: vagón nuevo\n(clic = t_agregar_vagon)', { fontFamily: 'monospace', fontSize: '10px', color: '#cfd3d8', align: 'center' }).setOrigin(0.5, 0).setDepth(900);
    this.patioZona = this.add.zone(this.patioPos.x, this.patioPos.y - 18, 62, 70).setInteractive({ useHandCursor: true });
    this.patioZona.on('pointerdown', () => this.gestor.solicitarTransicion('t_agregar_vagon'));
  }

  alFicha(f) {
    if (f.nuevo) {
      const v = this.sim.entidad(f.id);
      this.vistas.set(f.id, new VistaEntidad(this, v, CELDA.R1, ORIGEN, dibujarVagon, this.gestor));
      this.patio.setVisible(false); this.patioTxt.setVisible(false); this.patioZona.disableInteractive();
    } else {
      this.vistas.get(f.id).moverA(CELDA[f.a]);
    }
    this.dibujarMarcas();
  }

  // Tokens "Libre" (anillo verde) y conflicto (anillo naranja sobre R1) + marcado por posición en el panel izquierdo.
  dibujarMarcas() {
    const g = this.marcas; g.clear();
    const red = this.sim.red;
    const conflicto = red.conflictos().length > 0;
    const lineas = ['RED DE PETRI  ' + (this.sim.supervisorActivo ? '(N2: con Cupo)' : '(N1: sin prevención)')];
    for (const pos of POSICIONES) {
      const v = red.M[red.indiceP(`Vagon_${pos}`)], l = red.M[red.indiceP(`Libre_${pos}`)];
      const [cx, cy] = CELDA[pos];
      const p = aPantalla(cx, cy);
      const x = p.x + ORIGEN.x, y = p.y + ORIGEN.y;
      const color = l ? 0x2e9e5b : 0x555555;
      g.lineStyle(2, conflicto && pos === 'R1' ? 0xff9a2e : color, l || (conflicto && pos === 'R1') ? 0.95 : 0.5);
      g.strokePoints([{ x, y: y - 16 }, { x: x + 32, y }, { x, y: y + 16 }, { x: x - 32, y }], true);
      lineas.push(`${pos}  Vagon ${v}/1  Libre ${l}/1`);
    }
    if (red.indiceP) lineas.push(`Vagon_nuevo ${red.M[red.indiceP('Vagon_nuevo')]}/1` + (this.sim.supervisorActivo ? `  Cupo ${red.M[red.indiceP('Cupo')]}/1` : ''));
    if (conflicto) lineas.push('⚠ Conflicto en Libre_R1:\n  avanzar Z4 o agregar vagón');
    this.panelRed.setText(lineas.join('\n'));
  }

  mostrarDeadlock(d) {
    const o = (this.overlayDeadlock = []);
    const add = (x) => { o.push(x); return x; };
    add(this.add.rectangle(ANCHO / 2, ALTO / 2, 640, 300, 0x2a1416, 0.97).setStrokeStyle(2, 0xd64545).setDepth(11000));
    const marcado = Object.entries(d.marcado).map(([k, v]) => `${k}=${v}`).join('  ');
    add(this.add.text(ANCHO / 2, ALTO / 2 - 125, 'DEADLOCK: ningún vagón puede avanzar', { fontFamily: 'monospace', fontSize: '20px', color: '#ff7a7a' }).setOrigin(0.5).setDepth(11001));
    add(this.add.text(ANCHO / 2, ALTO / 2 - 5, `Marcado muerto: ${marcado}\n\nSecuencia que lo causó:\n${d.secuencia.join(' → ')}\n\nRegla de prevención: lugar monitor Cupo\n(vagones en el circuito ≤ posiciones − 1 = 5).\nActiva el supervisor [M] y no agregues el sexto vagón.`, { fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', align: 'center', wordWrap: { width: 600 }, lineSpacing: 1 }).setOrigin(0.5).setDepth(11001));
    const boton = (x, texto, color, fn) => {
      add(this.add.rectangle(x, ALTO / 2 + 118, 270, 32, color).setDepth(11001).setInteractive({ useHandCursor: true }).on('pointerdown', fn));
      add(this.add.text(x, ALTO / 2 + 118, texto, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' }).setOrigin(0.5).setDepth(11002));
    };
    boton(ANCHO / 2 - 140, 'Reintentar (último marcado verde)', 0x6b7480, () => this.sim.reintentar(false));
    boton(ANCHO / 2 + 140, 'Reintentar con supervisor activo', 0x2e9e5b, () => this.sim.reintentar(true));
    this.cameras.main.shake(400, 0.01);
  }

  // Tras reintentar: las vistas vuelven a las posiciones del marcado verde guardado.
  alReintento() {
    (this.overlayDeadlock || []).forEach((x) => x.destroy());
    this.overlayDeadlock = [];
    for (const [id, v] of [...this.vistas]) {
      const ent = this.sim.entidad(id);
      if (!ent) { v.destruir(); this.vistas.delete(id); }
    }
    for (const v of this.sim.vagones) this.vistas.get(v.id)?.colocar(CELDA[this.sim.posicion.get(v.id)]);
    if (this.sim.red.M[this.sim.red.indiceP('Vagon_nuevo')]) { this.patio.setVisible(true); this.patioTxt.setVisible(true); this.patioZona.setInteractive({ useHandCursor: true }); }
    this.dibujarMarcas();
  }

  // Alerta breve abajo a la derecha (la zona de alertas del GDD se completa en el paso del HUD de partida).
  alertar(texto) {
    const t = this.add.text(ANCHO - 12, ALTO - 12 - (this.alertas.length * 20), texto, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', backgroundColor: '#8a2b2bdd', padding: { x: 6, y: 3 } })
      .setOrigin(1, 1).setDepth(9000);
    this.alertas.push(t);
    this.tweens.add({ targets: t, alpha: 0, delay: 3500, duration: 800, onComplete: () => { this.alertas = this.alertas.filter((x) => x !== t); t.destroy(); } });
  }

  abrirHUD(id) {
    if (this.scene.isActive('HUDMaquina')) this.scene.stop('HUDMaquina');
    this.scene.launch('HUDMaquina', { id }); // en paralelo: no pausa la simulación
  }

  abrirInspector() {
    if (this.scene.isActive('Inspector')) { this.cerrarSuperpuestas(); return; }
    this.reloj.pausar(); // el inspector pausa la simulación
    this.scene.launch('Inspector');
  }

  cerrarSuperpuestas() {
    const habiaInspector = this.scene.isActive('Inspector');
    if (this.scene.isActive('HUDMaquina')) this.scene.stop('HUDMaquina');
    if (habiaInspector) { this.scene.stop('Inspector'); this.reloj.reanudar(); }
  }

  update(tiempo, delta) {
    // La única lógica de simulación: avanzar el reloj.
    this.sim.avanzar((delta / 1000) * this.reloj.velocidad);
    this.vigilarFps();
    if (this.children.list.length !== this._hijos) this.clasificar();
    this.txtReloj.setText(`Turno ${this.turno}/${TURNOS}   t = ${Math.min(180, this.reloj.ahora).toFixed(0)} s / 180 s${this.reloj.pausado ? '   PAUSA' : ''}   ×${this.reloj.velocidad}`);
    if (this.info.visible) {
      this.info.setText(`fps ${Math.round(this.game.loop.actualFps)}  ·  t = ${this.reloj.ahora.toFixed(1)} s  ·  x${this.reloj.velocidad}${this.reloj.pausado ? '  ·  PAUSA' : ''}`);
    }
  }
}
