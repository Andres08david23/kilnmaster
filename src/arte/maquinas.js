// Máquinas de la planta dibujadas en código (vista isométrica 2:1). Todas devuelven un Graphics
// con profundidad (x + y) para el orden de dibujo.
import { PALETA, COLOR_ESTADO, ICONO_ESTADO, colorTermico, sombra } from './paleta.js';
import { caja, aPantalla, profundidad } from './geom.js';
import { dibujarIcono } from './iconos.js';

// celdaX, celdaY: celda de la rejilla. Si se da `pos` ({x, y} en pantalla) se usa esa posición directa.
function origen(celdaX, celdaY, pos) {
  return pos || aPantalla(celdaX, celdaY);
}

export function dibujarMolienda(scene, celdaX, celdaY, estado = 'Lista', pos = null) {
  const g = scene.add.graphics();
  const { x, y } = origen(celdaX, celdaY, pos);
  caja(g, x, y, 0.9, 0.9, 14, PALETA.metal);
  caja(g, x, y - 14, 0.6, 0.6, 18, sombra(PALETA.metal, 1.1));
  // tolva
  g.fillStyle(sombra(PALETA.suelo, 1.3), 1);
  g.fillEllipse(x, y - 40, 30, 12);
  g.fillStyle(COLOR_ESTADO.Maquina[estado], 1);
  g.fillCircle(x + 22, y - 18, 4);
  dibujarIcono(g, ICONO_ESTADO.Maquina[estado], x, y - 58, 7);
  g.setDepth(profundidad(celdaX, celdaY));
  return g;
}

export function dibujarExtrusora(scene, celdaX, celdaY, estado = 'Lista', pos = null) {
  const g = scene.add.graphics();
  const { x, y } = origen(celdaX, celdaY, pos);
  caja(g, x, y, 0.95, 0.55, 16, PALETA.metal);
  caja(g, x + 14, y + 7, 0.3, 0.45, 12, sombra(PALETA.metal, 0.9));
  caja(g, x - 16, y - 8, 0.3, 0.4, 24, sombra(PALETA.metal, 1.1));
  g.fillStyle(COLOR_ESTADO.Maquina[estado], 1);
  g.fillCircle(x + 26, y - 6, 4);
  dibujarIcono(g, ICONO_ESTADO.Maquina[estado], x, y - 44, 7);
  g.setDepth(profundidad(celdaX, celdaY));
  return g;
}

export function dibujarCortadora(scene, celdaX, celdaY, estado = 'Lista', pos = null) {
  const g = scene.add.graphics();
  const { x, y } = origen(celdaX, celdaY, pos);
  caja(g, x, y, 0.9, 0.5, 10, PALETA.metal);
  caja(g, x, y - 10, 0.12, 0.7, 26, PALETA.riel);
  g.lineStyle(2, 0xd8dde3, 1);
  g.lineBetween(x - 14, y - 22, x + 14, y - 22);
  g.fillStyle(COLOR_ESTADO.Maquina[estado], 1);
  g.fillCircle(x + 24, y - 2, 4);
  dibujarIcono(g, ICONO_ESTADO.Maquina[estado], x, y - 50, 7);
  g.setDepth(profundidad(celdaX, celdaY));
  return g;
}

// Una zona del horno túnel. temperatura: 0 (frío) a 1 (incandescente).
export function dibujarZonaHorno(scene, celdaX, celdaY, temperatura = 0.2, pos = null) {
  const g = scene.add.graphics();
  const { x, y } = origen(celdaX, celdaY, pos);
  const c = colorTermico(temperatura);
  caja(g, x, y, 1, 1, 8, PALETA.riel); // base
  caja(g, x, y - 8, 0.96, 0.96, 18, PALETA.muro); // bóveda
  // boca del túnel iluminada por el color térmico
  g.fillStyle(0x15110f, 1);
  g.fillPoints([{ x: x - 16, y: y + 6 }, { x: x - 2, y: y + 14 }, { x: x - 2, y: y - 12 }, { x: x - 16, y: y - 20 }], true);
  g.fillStyle(c, 1);
  g.fillPoints([{ x: x - 13, y: y + 3 }, { x: x - 4, y: y + 8 }, { x: x - 4, y: y - 8 }, { x: x - 13, y: y - 15 }], true);
  g.setDepth(profundidad(celdaX, celdaY));
  g._colorTermico = c;
  return g;
}

export function dibujarVagon(scene, celdaX, celdaY, estado = 'Crudo', pos = null) {
  const g = scene.add.graphics();
  const { x, y } = origen(celdaX, celdaY, pos);
  const col = COLOR_ESTADO.Vagon[estado];
  caja(g, x, y, 0.7, 0.45, 7, PALETA.riel);
  // ladrillos apilados sobre el vagón; su color es el del estado
  caja(g, x, y - 7, 0.55, 0.35, 9, col);
  g.fillStyle(0x222222, 1);
  g.fillCircle(x - 10, y + 5, 3);
  g.fillCircle(x + 10, y + 5, 3);
  dibujarIcono(g, ICONO_ESTADO.Vagon[estado], x, y - 30, 6);
  g.setDepth(profundidad(celdaX, celdaY) + 0.5);
  return g;
}
