// Íconos de estado que se dibujan sobre las máquinas y vagones (en código, sin imágenes).
import { PALETA } from './paleta.js';

// g: Graphics de Phaser; (x, y): centro del ícono; r: radio aproximado en px.
export function dibujarIcono(g, tipo, x, y, r = 7) {
  g.fillStyle(0x000000, 0.55);
  g.fillCircle(x, y, r + 3);
  g.lineStyle(2, 0xffffff, 1);
  g.fillStyle(0xffffff, 1);
  switch (tipo) {
    case 'ladrillo':
      g.fillRect(x - r * 0.8, y - r * 0.45, r * 1.6, r * 0.9);
      break;
    case 'llama1':
      llama(g, x, y, r);
      break;
    case 'llama2':
      llama(g, x - r * 0.45, y + 1, r * 0.8);
      llama(g, x + r * 0.45, y + 1, r * 0.8);
      break;
    case 'copo':
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI) / 3;
        g.lineBetween(x - Math.cos(a) * r, y - Math.sin(a) * r, x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      break;
    case 'x':
      g.lineStyle(3, 0xffffff, 1);
      g.lineBetween(x - r * 0.7, y - r * 0.7, x + r * 0.7, y + r * 0.7);
      g.lineBetween(x - r * 0.7, y + r * 0.7, x + r * 0.7, y - r * 0.7);
      break;
    case 'engranaje':
      g.strokeCircle(x, y, r * 0.55);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        g.lineBetween(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      break;
    case 'pausa':
      g.fillRect(x - r * 0.6, y - r * 0.7, r * 0.45, r * 1.4);
      g.fillRect(x + r * 0.15, y - r * 0.7, r * 0.45, r * 1.4);
      break;
    case 'llave':
      g.strokeCircle(x - r * 0.4, y - r * 0.3, r * 0.4);
      g.lineBetween(x - r * 0.1, y, x + r * 0.7, y + r * 0.7);
      break;
    default:
      g.fillCircle(x, y, r * 0.4);
  }
}

function llama(g, x, y, r) {
  g.fillPoints([
    { x: x, y: y - r }, { x: x + r * 0.7, y: y + r * 0.5 }, { x: x, y: y + r * 0.9 }, { x: x - r * 0.7, y: y + r * 0.5 },
  ], true);
}

// Forma de cada tipo de token: caja (vagón), rombo hueco (posición libre), caja con flecha (vagón nuevo), rayo (cupo).
export function dibujarToken(g, tipo, x, y, escala = 1) {
  const s = 9 * escala;
  switch (tipo) {
    case 'Vagon':
      g.fillStyle(PALETA.tokenVagon, 1);
      g.fillRect(x - s, y - s * 0.6, s * 2, s * 1.2);
      g.lineStyle(1, 0x000000, 0.5);
      g.strokeRect(x - s, y - s * 0.6, s * 2, s * 1.2);
      g.fillStyle(0x2b2b2b, 1);
      g.fillCircle(x - s * 0.55, y + s * 0.7, s * 0.28);
      g.fillCircle(x + s * 0.55, y + s * 0.7, s * 0.28);
      break;
    case 'Libre':
      g.lineStyle(2, PALETA.tokenLibre, 1);
      g.strokePoints([{ x, y: y - s * 0.7 }, { x: x + s, y }, { x, y: y + s * 0.7 }, { x: x - s, y }], true);
      break;
    case 'Nuevo':
      g.fillStyle(PALETA.tokenNuevo, 1);
      g.fillRect(x - s, y - s * 0.6, s * 2, s * 1.2);
      g.lineStyle(2, 0x2b2b2b, 1);
      g.lineBetween(x - s * 0.5, y, x + s * 0.5, y);
      g.lineBetween(x + s * 0.1, y - s * 0.35, x + s * 0.5, y);
      g.lineBetween(x + s * 0.1, y + s * 0.35, x + s * 0.5, y);
      break;
    case 'Cupo':
      g.fillStyle(PALETA.tokenCupo, 1);
      g.fillPoints([
        { x: x + s * 0.2, y: y - s }, { x: x - s * 0.6, y: y + s * 0.1 }, { x: x - s * 0.05, y: y + s * 0.1 },
        { x: x - s * 0.25, y: y + s }, { x: x + s * 0.65, y: y - s * 0.2 }, { x: x + s * 0.1, y: y - s * 0.2 },
      ], true);
      break;
    default:
      g.fillCircle(x, y, s * 0.5);
  }
}
