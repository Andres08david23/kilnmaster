// Geometría isométrica 2:1 para las funciones de dibujo (celdas de 64x32 px).
import { sombra } from './paleta.js';

export const TILE_W = 64;
export const TILE_H = 32;

export const aPantalla = (x, y, z = 0) => ({
  x: (x - y) * TILE_W / 2,
  y: (x + y) * TILE_H / 2 - z * TILE_H,
});
export const profundidad = (x, y) => x + y;

// Rombo de una celda centrado en (cx, cy).
export function rombo(g, cx, cy, color, borde = null, escala = 1) {
  const w = TILE_W / 2 * escala, h = TILE_H / 2 * escala;
  g.fillStyle(color, 1);
  g.fillPoints([{ x: cx, y: cy - h }, { x: cx + w, y: cy }, { x: cx, y: cy + h }, { x: cx - w, y: cy }], true);
  if (borde !== null) {
    g.lineStyle(1, borde, 0.6);
    g.strokePoints([{ x: cx, y: cy - h }, { x: cx + w, y: cy }, { x: cx, y: cy + h }, { x: cx - w, y: cy }], true);
  }
}

// Caja isométrica centrada en (cx, cy) sobre el suelo. fx y fy son la fracción de la celda que ocupa
// en x y en y (0 a 1), alto en píxeles. La luz viene de arriba a la izquierda: la cara izquierda
// es la más clara y la derecha la más oscura.
export function caja(g, cx, cy, fx, fy, alto, color) {
  const ex = { x: 32 * fx, y: 16 * fx };
  const ey = { x: -32 * fy, y: 16 * fy };
  const A = { x: cx - (ex.x + ey.x) / 2, y: cy - (ex.y + ey.y) / 2 };
  const B = { x: cx + (ex.x - ey.x) / 2, y: cy + (ex.y - ey.y) / 2 };
  const C = { x: cx + (ex.x + ey.x) / 2, y: cy + (ex.y + ey.y) / 2 };
  const D = { x: cx - (ex.x - ey.x) / 2, y: cy - (ex.y - ey.y) / 2 };
  const up = (p) => ({ x: p.x, y: p.y - alto });
  g.fillStyle(sombra(color, 0.78), 1); // derecha
  g.fillPoints([B, C, up(C), up(B)], true);
  g.fillStyle(sombra(color, 0.95), 1); // izquierda
  g.fillPoints([D, C, up(C), up(D)], true);
  g.fillStyle(sombra(color, 1.18), 1); // tapa
  g.fillPoints([up(A), up(B), up(C), up(D)], true);
  g.lineStyle(1, 0x000000, 0.25);
  g.strokePoints([up(A), up(B), up(C), up(D)], true);
  return { A: up(A), B: up(B), C: up(C), D: up(D), centroTapa: { x: cx, y: cy - alto } };
}
