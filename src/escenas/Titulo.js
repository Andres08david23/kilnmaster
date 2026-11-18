// Pantalla de título: controles y botón iniciar.
import { ANCHO, ALTO } from '../config.js';

export class Titulo extends Phaser.Scene {
  constructor() { super('Titulo'); }

  create() {
    this.cameras.main.fadeIn(300, 28, 26, 30);
    this.add.rectangle(ANCHO / 2, ALTO / 2, ANCHO, ALTO, 0x1c1a1e);
    this.add.text(ANCHO / 2, 90, 'KilnMaster 2.5D', { fontFamily: 'monospace', fontSize: '40px', color: '#ff7a1a' }).setOrigin(0.5);
    this.add.text(ANCHO / 2, 135, 'Horno túnel y planta ladrillera', { fontFamily: 'monospace', fontSize: '16px', color: '#f1ece4' }).setOrigin(0.5);
    const controles = [
      'Controles',
      'Clic o toque: seleccionar máquina y abrir su HUD',
      'P: pausa     I: inspector de la red     Esc: cerrar',
      '1, 2, 4: velocidad     M: supervisor activo / modo manual     F1: fps y tiempo',
      'Meta: 400, 700 y 1000 puntos en 3 turnos de 180 s sin caer en deadlock',
    ];
    this.add.text(ANCHO / 2, 230, controles.join('\n'), { fontFamily: 'monospace', fontSize: '15px', color: '#cfd3d8', align: 'center', lineSpacing: 8 }).setOrigin(0.5);
    const boton = this.add.rectangle(ANCHO / 2, 400, 220, 50, 0x2e9e5b).setInteractive({ useHandCursor: true });
    this.add.text(ANCHO / 2, 400, 'INICIAR', { fontFamily: 'monospace', fontSize: '22px', color: '#ffffff' }).setOrigin(0.5);
    const iniciar = () => this.scene.start('Planta', { turno: 1 });
    boton.on('pointerdown', iniciar);
    this.input.keyboard.once('keydown-ENTER', iniciar);
  }
}
