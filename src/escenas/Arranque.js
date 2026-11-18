// Escena de arranque: barra de progreso y paso a la pantalla de título.
import { ANCHO, ALTO } from '../config.js';

export class Arranque extends Phaser.Scene {
  constructor() { super('Arranque'); }

  create() {
    this.add.rectangle(ANCHO / 2, ALTO / 2, ANCHO, ALTO, 0x1c1a1e);
    this.add.text(ANCHO / 2, ALTO / 2 - 40, 'KilnMaster 2.5D', { fontFamily: 'monospace', fontSize: '28px', color: '#f1ece4' }).setOrigin(0.5);
    this.add.rectangle(ANCHO / 2, ALTO / 2 + 10, 300, 14, 0x333333).setStrokeStyle(1, 0x888888);
    const barra = this.add.rectangle(ANCHO / 2 - 150, ALTO / 2 + 10, 1, 10, 0xe0b21b).setOrigin(0, 0.5);
    // Todo el arte se dibuja en código: no hay archivos que cargar, la barra solo marca el arranque.
    this.tweens.add({ targets: barra, width: 296, duration: 500, onComplete: () => this.scene.start('Titulo') });
  }
}
