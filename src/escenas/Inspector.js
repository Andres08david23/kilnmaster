// Inspector de la red de Petri (tecla I): pausa la simulación y muestra N = (P, T, Pre, Post, M0), A = Post − Pre,
// la ecuación de estado M_k = M_{k−1} + Aᵀ·u_k con "Probar disparo" (no cambia nada) y el árbol de cobertura.
// Solo lee la Simulación.
import { ANCHO, ALTO } from '../config.js';
import { PALETA, hex } from '../arte/paleta.js';
import { arbolCobertura } from '../sed/cobertura.js';

const FUENTE = (px, color = '#cfd3d8') => ({ fontFamily: 'monospace', fontSize: `${px}px`, color });
const num = (v) => (v === Infinity ? 'ω' : String(v)).padStart(3);

export class Inspector extends Phaser.Scene {
  constructor() { super('Inspector'); }

  create() {
    this.sim = this.registry.get('sim');
    this.gestor = this.registry.get('gestor');
    this.pestana = 'matrices';
    this.sel = 0;
    this.objs = [];
    this.add.rectangle(ANCHO / 2, ALTO / 2, ANCHO - 60, ALTO - 40, PALETA.hud, 0.97).setStrokeStyle(2, 0x666666);
    const red = this.sim.red;
    this.add.text(48, 26, `Inspector · ${red.modelo.nombre} (simulación en pausa)`, FUENTE(15, hex(PALETA.texto)));
    this.add.text(ANCHO - 48, ALTO - 28, 'I o Esc: cerrar', FUENTE(10, '#7d8794')).setOrigin(1, 0.5);
    [['matrices', 'Matrices'], ['arbol', 'Árbol de cobertura']].forEach(([clave, texto], i) => {
      const x = ANCHO - 48 - 250 + i * 100 + (i ? 20 : 0);
      const w = i ? 130 : 96;
      const r = this.add.rectangle(x, 34, w, 24, PALETA.metal, 0.6).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
      this.add.text(x + w / 2, 34, texto, FUENTE(11, '#ffffff')).setOrigin(0.5);
      r.on('pointerdown', () => { this.pestana = clave; this.dibujar(); });
      r.clave = clave; (this.tabs ||= []).push(r);
    });
    this.dibujar();
  }

  limpiar() { this.objs.forEach((o) => o.destroy()); this.objs = []; }
  add_(o) { this.objs.push(o); return o; }

  dibujar() {
    this.limpiar();
    this.tabs.forEach((r) => r.setFillStyle(this.pestana === r.clave ? PALETA.mantenimiento : PALETA.metal, this.pestana === r.clave ? 1 : 0.6));
    if (this.pestana === 'matrices') this.vistaMatrices(); else this.vistaArbol();
  }

  matriz(titulo, x, y, datos, resaltarFila) {
    const red = this.sim.red;
    const cab = '     ' + red.lugares.map((_, i) => `p${i + 1}`.padStart(3)).join('');
    const filas = datos.map((f, t) => `t${t + 1}`.padEnd(5) + f.map(num).join(''));
    this.add_(this.add.text(x, y - 18, titulo, FUENTE(12, hex(PALETA.texto))));
    if (resaltarFila !== null) this.add_(this.add.rectangle(x - 3, y + 17 + resaltarFila * 17.2, 330, 17, PALETA.mantenimiento, 0.35).setOrigin(0, 0));
    this.add_(this.add.text(x, y, [cab, ...filas].join('\n'), { ...FUENTE(11), lineSpacing: 3 }));
  }

  vistaMatrices() {
    const red = this.sim.red;
    const sel = this.sel;
    this.matriz(`Pre (${red.pre.length}×${red.lugares.length})`, 48, 86, red.pre, sel);
    this.matriz('Post', 400, 86, red.post, sel);
    this.matriz('A = Post − Pre', 48, 252, red.A, sel);
    // Ecuación de estado con el disparo elegido (sin aplicarlo)
    const r = this.sim.probarDisparo(sel);
    const vec = (v) => '[' + v.map((x) => (x === Infinity ? 'ω' : x)).join(' ') + ']';
    const ecuacion = [
      'M_k = M_{k−1} + Aᵀ · u_k',
      `M_{k−1} = ${vec(r.Mk1)}`,
      `u_k     = e${sel + 1}  (${r.transicion})`,
      `Aᵀ·u_k  = ${vec(r.ATu)}`,
      `M_k     = ${vec(r.Mk)}`,
      r.habilitada
        ? `✓ habilitada: M ≥ Pre(t) y M_k ≤ k. Radar tras el disparo: ${r.color.toUpperCase()}`
        : `✕ no habilitada: ${r.motivo ? (r.motivo.tipo === 'falta_token' ? `falta un token en ${r.motivo.lugar}` : `capacidad k = 1 de ${r.motivo.lugar}`) : '—'}`,
    ];
    this.add_(this.add.text(400, 234, 'Ecuación de estado', FUENTE(12, hex(PALETA.texto))));
    this.add_(this.add.text(400, 252, ecuacion.join('\n'), { ...FUENTE(11), lineSpacing: 4, wordWrap: { width: 500 } }));
    // Botones: elegir transición y "Probar disparo"
    red.transiciones.forEach((t, i) => {
      const x = 48 + i * 122, y = 412;
      const rect = this.add_(this.add.rectangle(x, y, 116, 24, i === sel ? PALETA.mantenimiento : PALETA.metal, i === sel ? 1 : 0.6).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }));
      this.add_(this.add.text(x + 58, y, `t${i + 1} ${t.nombre.replace('t_', '')}`.slice(0, 18), FUENTE(10, '#ffffff')).setOrigin(0.5));
      rect.on('pointerdown', () => { this.sel = i; this.dibujar(); });
    });
    this.add_(this.add.text(48, 430, 'Elige una transición para "Probar disparo": calcula M_k sin cambiar el juego.', FUENTE(10, '#9aa3ad')));
    const lug = red.lugares.map((l, i) => `p${i + 1}=${l.nombre}(${red.M[i]}/${l.k})`).join('  ');
    this.add_(this.add.text(48, 450, 'Marcado actual: ' + lug, { ...FUENTE(10), wordWrap: { width: ANCHO - 120 } }));
    const inv = this.sim.supervisorActivo ? 'Invariante: Vagon_Z1 + … + Vagon_R2 + Cupo = 5' : 'Sin Cupo: la red permite 6 vagones en 6 posiciones (deadlock).';
    this.add_(this.add.text(48, 488, inv + `   ·   Radar: ${this.sim.colorRadar().toUpperCase()}`, FUENTE(10, '#f2d16b')));
  }

  vistaArbol() {
    const red = this.sim.red;
    const arb = arbolCobertura(red, red.M, 400);
    this.add_(this.add.text(48, 70, `Árbol de cobertura desde el marcado actual: ${arb.nodos.length} nodos${arb.truncado ? ' (truncado)' : ''}, ${arb.muertos.length} marcados muertos`, FUENTE(11, hex(PALETA.texto))));
    this.add_(this.add.text(48, 88, 'verde = nuevo · gris = duplicado (repite un antecesor) · rojo = muerto (deadlock) · ω = no acotado', FUENTE(10, '#9aa3ad')));
    // niveles en columnas
    const prof = [];
    const d = (n) => (n.padre === null ? 0 : (prof[n.padre] ?? 0) + 1);
    arb.nodos.forEach((n) => { prof[n.id] = d(n); });
    const porNivel = new Map();
    arb.nodos.forEach((n) => { const l = porNivel.get(prof[n.id]) || []; l.push(n); porNivel.set(prof[n.id], l); });
    const niveles = [...porNivel.keys()].sort((a, b) => a - b).slice(0, 9);
    const pos = new Map();
    const dx = (ANCHO - 140) / Math.max(1, niveles.length);
    niveles.forEach((nv, c) => {
      const col = porNivel.get(nv).slice(0, 16);
      col.forEach((n, i) => pos.set(n.id, { x: 70 + c * dx, y: 120 + i * ((ALTO - 190) / Math.max(1, Math.min(16, col.length))) }));
    });
    const g = this.add_(this.add.graphics());
    g.lineStyle(1, 0x8892a0, 0.7);
    for (const a of arb.aristas) {
      const p = pos.get(a.de), q = pos.get(a.a);
      if (p && q) g.lineBetween(p.x, p.y, q.x, q.y);
    }
    const color = { nuevo: PALETA.operacion, duplicado: 0x777f89, muerto: PALETA.fallo };
    for (const n of arb.nodos) {
      const p = pos.get(n.id);
      if (!p) continue;
      g.fillStyle(color[n.tipo], 1);
      g.fillCircle(p.x, p.y, n.id === 0 ? 8 : 6);
      if (n.id === 0) { g.lineStyle(2, 0xffffff, 1); g.strokeCircle(p.x, p.y, 10); g.lineStyle(1, 0x8892a0, 0.7); }
      if (n.via !== null) this.add_(this.add.text(p.x - 14, p.y - 14, `t${n.via + 1}`, FUENTE(9, '#9aa3ad')));
      if (n.M.includes(Infinity)) this.add_(this.add.text(p.x + 8, p.y - 4, 'ω', FUENTE(11, '#f2d16b')));
    }
  }
}
