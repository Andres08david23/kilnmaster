// Suelo, muros y rieles de la planta en vista isométrica.
import { PALETA, sombra } from './paleta.js';
import { rombo, caja, aPantalla, profundidad } from './geom.js';

export function dibujarSuelo(scene, columnas, filas, ox = 0, oy = 0) {
  const g = scene.add.graphics();
  for (let x = 0; x < columnas; x++) {
    for (let y = 0; y < filas; y++) {
      const p = aPantalla(x, y);
      rombo(g, p.x + ox, p.y + oy, (x + y) % 2 ? PALETA.suelo : sombra(PALETA.suelo, 1.1), 0x000000);
    }
  }
  g.setDepth(-1000);
  return g;
}

// Riel sobre la celda (x, y). eje 'x': sigue la dirección +x de la rejilla; eje 'y': la dirección +y.
// Dos rieles paralelos con durmientes.
export function dibujarRiel(scene, celdaX, celdaY, ox = 0, oy = 0, eje = 'x') {
  const g = scene.add.graphics();
  const p = aPantalla(celdaX, celdaY);
  const cx = p.x + ox, cy = p.y + oy;
  const d = eje === 'x' ? { x: 16, y: 8 } : { x: -16, y: 8 }; // medio tramo a lo largo del riel
  const l = eje === 'x' ? { x: -6, y: 3 } : { x: 6, y: 3 }; // separación lateral entre rieles
  g.lineStyle(2, 0x6b4f35, 1); // durmientes
  for (const k of [-0.6, 0, 0.6]) {
    g.lineBetween(cx + d.x * k + l.x * 1.6, cy + d.y * k + l.y * 1.6, cx + d.x * k - l.x * 1.6, cy + d.y * k - l.y * 1.6);
  }
  g.lineStyle(2, 0xaeb6c0, 1); // rieles
  g.lineBetween(cx - d.x + l.x, cy - d.y + l.y, cx + d.x + l.x, cy + d.y + l.y);
  g.lineBetween(cx - d.x - l.x, cy - d.y - l.y, cx + d.x - l.x, cy + d.y - l.y);
  g.setDepth(profundidad(celdaX, celdaY) - 0.9);
  return g;
}

export function dibujarMuro(scene, celdaX, celdaY, ox = 0, oy = 0) {
  const g = scene.add.graphics();
  const p = aPantalla(celdaX, celdaY);
  caja(g, p.x + ox, p.y + oy, 1, 1, 30, PALETA.muro);
  g.setDepth(profundidad(celdaX, celdaY));
  return g;
}
