// Radar del Árbol de Cobertura: círculo en una esquina fija. verde, amarillo parpadeante o rojo.
import { PALETA } from './paleta.js';

const COLOR = { verde: PALETA.operacion, amarillo: PALETA.espera, rojo: PALETA.fallo };

export function dibujarRadar(g, x, y, estado, r = 26) {
  const c = COLOR[estado];
  g.fillStyle(PALETA.hud, 0.9);
  g.fillCircle(x, y, r + 6);
  g.lineStyle(2, c, 1);
  g.strokeCircle(x, y, r);
  g.strokeCircle(x, y, r * 0.6);
  g.lineBetween(x - r, y, x + r, y);
  g.lineBetween(x, y - r, x, y + r);
  g.fillStyle(c, 0.9);
  g.fillCircle(x, y, r * 0.3);
  if (estado === 'rojo') {
    g.lineStyle(4, c, 1);
    g.lineBetween(x - r * 0.5, y - r * 0.5, x + r * 0.5, y + r * 0.5);
    g.lineBetween(x - r * 0.5, y + r * 0.5, x + r * 0.5, y - r * 0.5);
  }
}

export class Radar {
  constructor(scene, x, y) {
    this.scene = scene;
    this.g = scene.add.graphics();
    this.x = x; this.y = y;
    this.estado = 'verde';
    this.tween = null;
    this.set('verde');
  }

  set(estado) {
    this.estado = estado;
    this.g.clear();
    dibujarRadar(this.g, this.x, this.y, estado);
    if (this.tween) { this.tween.stop(); this.tween = null; }
    this.g.alpha = 1;
    if (estado === 'amarillo') {
      this.tween = this.scene.tweens.add({ targets: this.g, alpha: 0.35, duration: 450, yoyo: true, repeat: -1 });
    }
  }
}
