// Proyección isométrica 2:1 (celdas de 64x32 px).
import { TILE_W, TILE_H } from '../config.js';

// Celda (x, y) a altura z a coordenadas de pantalla (relativas al origen de la planta).
export function aPantalla(x, y, z = 0) {
  return {
    x: (x - y) * TILE_W / 2,
    y: (x + y) * TILE_H / 2 - z * TILE_H,
  };
}

// Inversa: qué celda se tocó. (px, py) relativos al mismo origen de la planta; z = 0.
export function aCelda(px, py) {
  const a = px / (TILE_W / 2); // x - y
  const b = py / (TILE_H / 2); // x + y
  const x = (a + b) / 2;
  const y = (b - a) / 2;
  return { x: Math.floor(x + 0.5), y: Math.floor(y + 0.5) };
}

// Valor de orden de profundidad: el más cercano a la cámara tiene el mayor valor.
export function profundidad(x, y) {
  return x + y;
}
