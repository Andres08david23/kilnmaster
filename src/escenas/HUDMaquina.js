// HUD de máquina: escena superpuesta que se lanza en paralelo a Planta (no pausa la simulación).
// Dibuja el grafo del autómata de la entidad con su estado actual iluminado, un botón por cada evento de Γ(q)
// y la lista de sus últimos 10 eventos. Solo lee la simulación y le envía solicitudes.
import { ANCHO, ALTO } from '../config.js';
import { GrafoAutomata } from '../arte/hudAutomata.js';
import { COLOR_ESTADO, PALETA, hex } from '../arte/paleta.js';
import { LAYOUT } from '../juego/layouts.js';

const PANEL = { x: ANCHO - 250, y: ALTO / 2, w: 480, h: 500 };

export class HUDMaquina extends Phaser.Scene {
  constructor() { super('HUDMaquina'); }

  init(datos) { this.idEntidad = datos.id; }

  create() {
    this.sim = this.registry.get('sim');
    this.gestor = this.registry.get('gestor');
    this.ent = this.sim.entidad(this.idEntidad);
    const tipo = this.ent.tipo === 'vagon' ? 'vagon' : 'maquina';
    const modelo = this.ent.automata.modelo;

    this.add.rectangle(PANEL.x, PANEL.y, PANEL.w, PANEL.h, PALETA.hud, 0.95).setStrokeStyle(2, 0x666666);
    const izq = PANEL.x - PANEL.w / 2 + 16;
    this.titulo = this.add.text(izq, 22, '', { fontFamily: 'monospace', fontSize: '16px', color: hex(PALETA.texto) });
    this.subtitulo = this.add.text(izq, 44, '', { fontFamily: 'monospace', fontSize: '12px', color: '#9aa3ad' });

    this.grafo = new GrafoAutomata(this, PANEL.x, 150, modelo, {
      colores: COLOR_ESTADO[tipo === 'vagon' ? 'Vagon' : 'Maquina'],
      layout: LAYOUT[tipo],
    });
    this.grafo.setEstado(this.ent.automata.estado);

    this.botones = [];
    this.tooltip = this.add.text(izq, 306, '', { fontFamily: 'monospace', fontSize: '11px', color: '#ff9a9a', wordWrap: { width: PANEL.w - 32 } });
    this.lista = this.add.text(izq, 346, '', { fontFamily: 'monospace', fontSize: '10px', color: '#cfd3d8', lineSpacing: 1 });
    this.listaTitulo = this.add.text(izq, 326, 'Últimos eventos (palabra observada):', { fontFamily: 'monospace', fontSize: '12px', color: hex(PALETA.texto) });
    this.add.text(izq, ALTO - 34, 'Verde: controlable y habilitado · Gris: no controlable\nRojo: lo deshabilita el supervisor · Esc: cerrar', { fontFamily: 'monospace', fontSize: '10px', color: '#7d8794' });

    this.consolaActiva = false;
    this.consolaObjs = [];
    this.pestana = 'automata';
    this.compObjs = [];
    if (this.ent.tipo === 'vagon') this.crearPestanas();
    this.alRefrescar = () => { if (this.scene.isActive()) this.refrescar(); };
    this.sim.on('supervisor', this.alRefrescar);
    this.sim.on('ficha', this.alRefrescar);
    this.input.keyboard.on('keydown', (ev) => this.teclaConsola(ev));
    this.refrescar();
    const cb = (e, reg) => {
      if (e.id !== this.idEntidad) return;
      this.grafo.setEstado(reg.a, [reg.de, reg.evento, reg.a]);
      this.refrescar();
    };
    this.alRespuesta = (r) => { if (r.id === this.idEntidad && !r.ok) this.tooltip.setText('✕ ' + r.razon); };
    this.sim.on('cambio', cb);
    this.sim.on('respuesta', this.alRespuesta);
    this.sim.on('transicionBloqueada', this.alBloqueo = (d) => this.tooltip.setText(`✕ ${d.transicion}: ${d.razon}`));
    this.events.once('shutdown', () => {
      this.sim.off('supervisor', this.alRefrescar);
      this.sim.off('ficha', this.alRefrescar);
      this.sim.off('transicionBloqueada', this.alBloqueo);
      this.sim.off('cambio', cb);
      this.sim.off('respuesta', this.alRespuesta);
      this.gestor.bloqueado = false;
    });
  }

  // Pestañas Autómata y Composición (solo vagones: G1 ‖ G2 con su especificación).
  crearPestanas() {
    const x0 = PANEL.x + PANEL.w / 2 - 190;
    const mk = (x, texto, clave) => {
      const r = this.add.rectangle(x, 22, 88, 24, PALETA.metal, 0.6).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
      const t = this.add.text(x + 44, 22, texto, { fontFamily: 'monospace', fontSize: '11px', color: '#ffffff' }).setOrigin(0.5);
      r.on('pointerdown', () => { this.pestana = clave; this.refrescar(); });
      return { r, t, clave };
    };
    this.tabs = [mk(x0, 'Autómata', 'automata'), mk(x0 + 94, 'Composición', 'comp')];
  }

  vistaComposicion() {
    this.compObjs.forEach((o) => o.destroy());
    this.compObjs = [];
    if (this.pestana !== 'comp') return;
    const s = this.sim;
    const x = PANEL.x - PANEL.w / 2 + 16;
    const fondo = this.add.rectangle(PANEL.x, 140, PANEL.w - 16, 190, PALETA.hud).setStrokeStyle(1, 0x555555);
    const lineas = [
      'COMPOSICIÓN SÍNCRONA  G1 ‖ G2',
      `G1 = Vagón (${s.vagones[0].automata.modelo.estados.length} estados)`,
      `G2 = Especificación de secuencia (${s.composicion.estados.length} estados, sin Quebrado)`,
      `|G1 ‖ G2| = ${s.composicion.estados.length} estados alcanzables (compara con Supremica)`,
      '',
      s.supervisorActivo ? `Estado compuesto actual: ${s.estadoComposicion(this.idEntidad)}` : 'Modo MANUAL: la especificación no actúa sobre el jugador.',
      `Prohibido: Quebrado  ·  Σuc = ∅`,
      ...(s.deshabilitados(this.idEntidad).length
        ? ['Deshabilitados:', ...s.deshabilitados(this.idEntidad).map((d) => ` ${d.razon}`)]
        : ['Deshabilitados: ninguno']),
    ];
    const t = this.add.text(x, 52, lineas.join('\n'), { fontFamily: 'monospace', fontSize: '11px', color: '#cfd3d8', lineSpacing: 5, wordWrap: { width: PANEL.w - 40 } });
    this.compObjs.push(fondo, t);
  }

  // Γ(q): botones de los eventos con transición definida desde el estado actual.
  refrescar() {
    const a = this.ent.automata;
    this.titulo.setText(`${this.ent.id}  ·  estado: ${a.estado}${a.esMarcado() ? '  (marcado)' : ''}`);
    this.subtitulo.setText(`Autómata ${a.nombre}: ${a.modelo.estados.length} estados, ${a.modelo.eventos.length} eventos`);
    this.botones.forEach((b) => b.destroy());
    this.botones = [];
    const deshab = new Map(this.sim.deshabilitados(this.idEntidad).map((d) => [d.evento, d.razon]));
    this.grafo.setDeshabilitados([...deshab.keys()]);
    const eventos = a.eventosActivos();
    const izq = PANEL.x - PANEL.w / 2 + 16;
    eventos.forEach((ev, i) => {
      const x = izq + i * 118, y = 284;
      const viaConsola = ev === 'limpiar_vagon'; // solo se ejecuta desde la consola de reparación
      const lejos = this.sim.fueraDeZona(this.idEntidad, ev); // fuera de su zona: gris, con la razón al pasar el mouse
      const controlable = a.esControlable(ev) && !viaConsola && !lejos;
      const bloqueado = deshab.has(ev);
      const color = bloqueado ? PALETA.deshabilitado : controlable ? PALETA.operacion : 0x6b7480;
      const rect = this.add.rectangle(x, y, 110, 30, color).setOrigin(0, 0.5);
      const txt = this.add.text(x + 55, y, `${a.codigo(ev)} ${ev}${bloqueado ? ' ✕' : ''}`, { fontFamily: 'monospace', fontSize: '11px', color: '#ffffff' }).setOrigin(0.5);
      if (controlable && !bloqueado) {
        rect.setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.tooltip.setText(''); this.gestor.solicitarEvento(this.idEntidad, ev); });
      } else if (bloqueado) {
        // El jugador puede insistir: el supervisor lo impide, registra el intento y la cámara tiembla.
        rect.setInteractive({ useHandCursor: true })
          .on('pointerover', () => this.tooltip.setText(`✕ ${a.codigo(ev)}: ${deshab.get(ev)}`))
          .on('pointerout', () => this.tooltip.setText(''))
          .on('pointerdown', () => this.gestor.solicitarEvento(this.idEntidad, ev));
      } else {
        rect.setInteractive({ useHandCursor: !!lejos }).on('pointerdown', () => { if (lejos) this.gestor.solicitarEvento(this.idEntidad, ev); }).on('pointerover', () => this.tooltip.setText(lejos ? `✕ ${lejos}` : bloqueado ? `✕ ${a.codigo(ev)}: ${deshab.get(ev)}` : viaConsola ? `${a.codigo(ev)}: se ejecuta desde la consola de reparación (escribe una palabra de L)` : `${a.codigo(ev)}: evento no controlable (solo informativo)`))
          .on('pointerout', () => this.tooltip.setText(''));
      }
      this.botones.push(rect, txt);
    });
    // Los vagones también avanzan por el circuito: dispara t_avanzar_X en la red de Petri.
    if (this.ent.tipo === 'vagon') {
      const pos = this.sim.posicion.get(this.idEntidad);
      const t = `t_avanzar_${pos}`;
      const x = izq + eventos.length * 118, y = 284;
      const ok = this.sim.red.habilitada(t);
      const rect = this.add.rectangle(x, y, 150, 30, ok ? 0x3b7dd8 : 0x6b7480).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
      const txt = this.add.text(x + 75, y, `▶ Avanzar (${pos})`, { fontFamily: 'monospace', fontSize: '11px', color: '#ffffff' }).setOrigin(0.5);
      rect.on('pointerdown', () => this.gestor.solicitarTransicion(t));
      rect.on('pointerover', () => {
        const m = this.sim.red.motivoBloqueo(t);
        this.tooltip.setText(m ? `${t} bloqueada: ${m.tipo === 'falta_token' ? 'falta un token en' : 'capacidad k = 1 de'} ${m.lugar}` : `${t}: Pre = Vagon_${pos} + Libre_siguiente`);
      }).on('pointerout', () => this.tooltip.setText(''));
      this.botones.push(rect, txt);
    }
    const ult = a.historial.slice(-10);
    this.lista.setText(ult.length ? ult.map((h) => `${a.codigo(h.evento)}  ${h.de} → ${h.a}`).join('\n') : '(sin eventos todavía)');
    // Consola de reparación: aparece cuando el vagón entra en Quebrado y desaparece al repararlo.
    if (this.tabs) {
      this.tabs.forEach(({ r, clave }) => r.setFillStyle(this.pestana === clave ? PALETA.mantenimiento : PALETA.metal, this.pestana === clave ? 1 : 0.6));
      this.grafo.contenedor.setVisible(this.pestana === 'automata');
      this.vistaComposicion();
    }
    const quebrado = this.ent.tipo === 'vagon' && a.estado === 'Quebrado';
    if (quebrado && !this.consolaActiva) this.abrirConsola();
    else if (!quebrado && this.consolaActiva) this.cerrarConsola();
    this.lista.setVisible(!this.consolaActiva);
    this.listaTitulo.setVisible(!this.consolaActiva);
  }

  // ---- Consola de reparación por expresión regular ----
  abrirConsola() {
    this.consolaActiva = true;
    this.gestor.bloqueado = true; // P, I, 1, 2 y 4 son texto mientras se escribe
    this.palabra = '';
    this.lg = this.sim.nuevoLenguaje();
    this.mensaje = '';
    this.consolaVista();
  }

  cerrarConsola() {
    this.consolaActiva = false;
    this.gestor.bloqueado = false;
    this.consolaObjs.forEach((o) => o.destroy());
    this.consolaObjs = [];
  }

  teclaConsola(ev) {
    if (!this.consolaActiva) return;
    const k = ev.key.toUpperCase();
    if ('PCE'.includes(k) && k.length === 1) this.escribir(k);
    else if (ev.key === 'Backspace') this.borrar();
    else if (ev.key === 'Enter') this.enviar();
  }

  escribir(c) {
    if (!this.consolaActiva || this.palabra.length >= 8) return;
    this.mensaje = '';
    this.paso = this.lg.avanzar(c);
    this.palabra += c;
    this.consolaVista();
  }

  borrar() {
    if (!this.consolaActiva) return;
    this.palabra = this.palabra.slice(0, -1);
    this.lg = this.sim.nuevoLenguaje();
    this.paso = null;
    for (const c of this.palabra) this.paso = this.lg.avanzar(c);
    this.mensaje = '';
    this.consolaVista();
  }

  enviar() {
    if (!this.consolaActiva) return;
    const w = this.palabra;
    const r = this.sim.repararVagon(this.idEntidad, w);
    if (!r.ok && this.consolaActiva) {
      this.mensajeColor = '#ff9a9a';
      this.mensaje = `✕ ${r.razon}. −10 puntos`;
      this.palabra = '';
      this.lg = this.sim.nuevoLenguaje();
      this.paso = null;
      this.consolaVista();
    }
  }

  ayuda() {
    if (!this.consolaActiva) return;
    const expr = this.sim.pedirAyuda();
    this.mensajeColor = '#f2d16b';
    this.mensaje = `Ayuda: ${expr}   (−20 puntos)`;
    this.consolaVista();
  }

  consolaVista() {
    this.consolaObjs.forEach((o) => o.destroy());
    this.consolaObjs = [];
    const izq = PANEL.x - PANEL.w / 2 + 16;
    const add = (o) => { this.consolaObjs.push(o); return o; };
    add(this.add.text(izq, 326, 'CONSOLA DE REPARACIÓN: receta térmica del vagón', { fontFamily: 'monospace', fontSize: '12px', color: '#f2d16b' }));
    add(this.add.text(izq, 344, 'P precalentar · C ciclo de cocción · E enfriar. Escribe la receta y pulsa Enter.', { fontFamily: 'monospace', fontSize: '10px', color: '#9aa3ad', wordWrap: { width: PANEL.w - 32 } }));
    // palabra escrita: cada letra se pinta según el progreso del DFA
    const lg = this.sim.nuevoLenguaje();
    let vivo = true;
    [...this.palabra].forEach((c, i) => {
      const r = lg.avanzar(c);
      if (!r.valido) vivo = false;
      add(this.add.text(izq + i * 22, 362, c, { fontFamily: 'monospace', fontSize: '24px', color: vivo ? '#7fd6a0' : '#ff6a6a', backgroundColor: '#00000066' }));
    });
    add(this.add.text(izq + this.palabra.length * 22, 362, '_', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' }));
    // estado del DFA y qué se esperaba
    let estado;
    if (!this.palabra.length) estado = `DFA en q0 · se espera: ${this.lg.simbolosEsperados().join(' o ')}`;
    else if (this.paso && !this.paso.valido) estado = `✕ ese símbolo no tiene transición · se esperaba: ${this.paso.esperados.join(' o ')}`;
    else estado = `DFA en ${this.lg.estado}${this.paso && this.paso.marcado ? ' (aceptación)' : ''} · se espera: ${this.lg.simbolosEsperados().join(' o ') || '—'}`;
    add(this.add.text(izq, 396, estado, { fontFamily: 'monospace', fontSize: '11px', color: this.paso && !this.paso.valido ? '#ff9a9a' : '#cfd3d8', wordWrap: { width: PANEL.w - 32 } }));
    if (this.mensaje) add(this.add.text(izq, 414, this.mensaje, { fontFamily: 'monospace', fontSize: '11px', color: this.mensajeColor || '#cfd3d8', wordWrap: { width: PANEL.w - 32 } }));
    // botones (también sirven en pantalla táctil)
    const boton = (x, w, texto, color, fn) => {
      const r = add(this.add.rectangle(x, 450, w, 28, color).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }));
      r.on('pointerdown', fn);
      add(this.add.text(x + w / 2, 450, texto, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' }).setOrigin(0.5));
    };
    boton(izq, 44, 'P', 0x3b7dd8, () => this.escribir('P'));
    boton(izq + 50, 44, 'C', 0x3b7dd8, () => this.escribir('C'));
    boton(izq + 100, 44, 'E', 0x3b7dd8, () => this.escribir('E'));
    boton(izq + 156, 70, '⌫ Borrar', 0x6b7480, () => this.borrar());
    boton(izq + 232, 82, 'Enviar ↵', 0x2e9e5b, () => this.enviar());
    boton(izq + 320, 122, '? Ayuda (−20)', 0xa07a1a, () => this.ayuda());
  }
}
