// Grafo de un autómata dibujado con Graphics y Text de Phaser: un nodo circular por estado,
// flechas con el código del evento, estado inicial con flecha de entrada, marcados con doble círculo,
// estado actual iluminado y eventos deshabilitados en rojo. Se reutiliza en el HUD de máquina.
import { PALETA, hex } from './paleta.js';

const R = 22; // radio de los nodos (px)

export class GrafoAutomata {
  // modelo: { estados, inicial, marcados, eventos:[{id, codigo}], transiciones:[[de, evento, a]] }
  // colores: { estado: 0xRRGGBB } para iluminar el estado actual.
  constructor(scene, x, y, modelo, opciones = {}) {
    this.scene = scene;
    this.modelo = modelo;
    this.colores = opciones.colores || {};
    this.layout = opciones.layout || GrafoAutomata.layoutCircular(modelo.estados, opciones.radio || 110);
    this.estadoActual = modelo.inicial;
    this.deshabilitados = new Set();
    this.ultima = null;
    this.contenedor = scene.add.container(x, y);
    this.gAristas = scene.add.graphics();
    this.gNodos = scene.add.graphics();
    this.gActual = scene.add.graphics();
    this.contenedor.add([this.gAristas, this.gNodos, this.gActual]);
    this.textos = [];
    this._crearTextos();
    this.dibujar();
  }

  static layoutCircular(estados, radio) {
    const lay = {};
    estados.forEach((q, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / estados.length;
      lay[q] = [Math.cos(a) * radio * 1.3, Math.sin(a) * radio];
    });
    return lay;
  }

  _codigo(idEvento) {
    const e = this.modelo.eventos.find((v) => v.id === idEvento);
    return e ? e.codigo : idEvento;
  }

  _crearTextos() {
    const estilo = { fontFamily: 'monospace', fontSize: '11px', color: hex(PALETA.texto), align: 'center' };
    for (const q of this.modelo.estados) {
      const [px, py] = this.layout[q];
      const t = this.scene.add.text(px, py + R + 4, q, estilo).setOrigin(0.5, 0);
      this.contenedor.add(t);
      this.textos.push(t);
    }
    this.etiquetas = [];
  }

  // Puntos de la arista (curva cuadrática) entre dos estados.
  _curva(de, a, indice) {
    const [x1, y1] = this.layout[de];
    const [x2, y2] = this.layout[a];
    if (de === a) {
      // bucle sobre el nodo
      return { pts: bucle(x1, y1, indice), fin: { x: x1 + 6, y: y1 - R - 2, ang: Math.PI / 2 }, medio: { x: x1, y: y1 - R - 26 - indice * 6 } };
    }
    const dx = x2 - x1, dy = y2 - y1;
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d;
    const nx = -uy, ny = ux;
    const curv = indice * 26;
    const sx = x1 + ux * R + nx * curv * 0.25, sy = y1 + uy * R + ny * curv * 0.25;
    const ex = x2 - ux * (R + 4) + nx * curv * 0.25, ey = y2 - uy * (R + 4) + ny * curv * 0.25;
    const cx = (x1 + x2) / 2 + nx * curv, cy = (y1 + y2) / 2 + ny * curv;
    const pts = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      pts.push({
        x: (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * ex,
        y: (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ey,
      });
    }
    const m = { x: 0.25 * sx + 0.5 * cx + 0.25 * ex, y: 0.25 * sy + 0.5 * cy + 0.25 * ey };
    return { pts, fin: { x: ex, y: ey, ang: Math.atan2(ey - cy, ex - cx) }, medio: m };
  }

  dibujar() {
    const g = this.gAristas;
    g.clear();
    this.etiquetas.forEach((t) => t.destroy());
    this.etiquetas = [];
    const estilo = { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', backgroundColor: '#00000088' };
    // flecha de entrada del estado inicial
    const [ix, iy] = this.layout[this.modelo.inicial];
    g.lineStyle(2, 0xcfd3d8, 1);
    g.lineBetween(ix - R - 26, iy, ix - R - 3, iy);
    flecha(g, ix - R - 3, iy, 0, 0xcfd3d8);
    // aristas
    const contador = {};
    for (const [de, ev, a] of this.modelo.transiciones) {
      const par = [de, a].sort().join('|');
      const hayInversa = de !== a && this.modelo.transiciones.some((t) => t[0] === a && t[2] === de);
      let indice = de === a ? (contador[de + '*'] = (contador[de + '*'] || 0) + 1) - 1 : hayInversa ? (de < a ? 1 : 1) : 0;
      const deshab = de === this.estadoActual && this.deshabilitados.has(ev);
      const esUltima = this.ultima && this.ultima[0] === de && this.ultima[1] === ev && this.ultima[2] === a;
      const color = deshab ? PALETA.deshabilitado : esUltima ? 0xffffff : 0x9aa3ad;
      const c = this._curva(de, a, indice);
      g.lineStyle(esUltima ? 4 : 2, color, 1);
      g.strokePoints(c.pts, false);
      flecha(g, c.fin.x, c.fin.y, c.fin.ang, color);
      const t = this.scene.add.text(c.medio.x, c.medio.y, this._codigo(ev), { ...estilo, color: deshab ? '#ff9a9a' : '#ffffff' }).setOrigin(0.5);
      this.contenedor.add(t);
      this.etiquetas.push(t);
    }
    // nodos
    const gn = this.gNodos;
    gn.clear();
    this.gActual.clear();
    for (const q of this.modelo.estados) {
      const [px, py] = this.layout[q];
      const actual = q === this.estadoActual;
      const col = this.colores[q] ?? PALETA.metal;
      const dest = actual ? this.gActual : gn;
      dest.fillStyle(actual ? col : PALETA.hud, 1);
      dest.fillCircle(px, py, R);
      dest.lineStyle(actual ? 4 : 2, actual ? 0xffffff : col, 1);
      dest.strokeCircle(px, py, R);
      if (this.modelo.marcados.includes(q)) {
        dest.lineStyle(2, actual ? 0xffffff : col, 1);
        dest.strokeCircle(px, py, R - 5);
      }
    }
    this._glow();
  }

  _glow() {
    // Glow de Phaser 4 sobre el estado actual (si el filtro no existe, no se ilumina y no pasa nada).
    try {
      if (!this.gActual.filters && this.gActual.enableFilters) this.gActual.enableFilters();
      const lista = this.gActual.filters && this.gActual.filters.internal;
      if (lista && !this._conGlow) {
        lista.addGlow(0xffffff, 3, 0, 1, false, 10, 10);
        this._conGlow = true;
      }
    } catch (e) { /* sin filtros */ }
  }

  setEstado(q, ultima = null) {
    this.estadoActual = q;
    this.ultima = ultima;
    this.dibujar();
    if (ultima) {
      this.scene.time.delayedCall(500, () => { if (this.contenedor.scene) { this.ultima = null; this.dibujar(); } });
    }
  }

  setDeshabilitados(ids) {
    this.deshabilitados = new Set(ids);
    this.dibujar();
  }

  destruir() { this.contenedor.destroy(); }
}

function bucle(x, y, i) {
  const pts = [];
  const r = 13 + i * 6;
  for (let k = 0; k <= 20; k++) {
    const a = Math.PI * 1.15 + (k / 20) * Math.PI * 1.7;
    pts.push({ x: x + Math.cos(a) * r, y: y - R - 4 + Math.sin(a) * r * 0.9 });
  }
  return pts;
}

function flecha(g, x, y, ang, color) {
  const l = 8;
  g.fillStyle(color, 1);
  g.fillPoints([
    { x, y },
    { x: x - Math.cos(ang - 0.45) * l, y: y - Math.sin(ang - 0.45) * l },
    { x: x - Math.cos(ang + 0.45) * l, y: y - Math.sin(ang + 0.45) * l },
  ], true);
}
