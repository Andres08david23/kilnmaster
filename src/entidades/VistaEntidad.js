// Vista de una entidad (máquina o vagón): dibuja su sprite según el estado de su autómata y atiende el clic.
// Nunca cambia de estado por su cuenta: se redibuja cuando la simulación avisa de un cambio.
import { aPantalla } from '../iso/proyeccion.js';

export class VistaEntidad {
  // dibujar(scene, celdaX, celdaY, estado, pos) devuelve un Graphics (src/arte/maquinas.js).
  constructor(scene, entidad, celda, origen, dibujar, gestor) {
    this.scene = scene;
    this.entidad = entidad;
    this.celda = celda;
    this.origen = origen;
    this.dibujar = dibujar;
    const p = aPantalla(celda[0], celda[1]);
    this.pos = { x: p.x + origen.x, y: p.y + origen.y };
    this.g = null;
    this.zona = scene.add.zone(this.pos.x, this.pos.y - 18, 62, 70).setInteractive({ useHandCursor: true });
    this.zona.on('pointerdown', () => gestor.seleccionar(entidad.id));
    this.zona.on('pointerover', () => this.resaltar(true));
    this.zona.on('pointerout', () => this.resaltar(false));
    this.brillo = scene.add.graphics();
    this.redibujar();
  }

  get estado() { return this.entidad.automata.estado; }

  redibujar() {
    if (this.g) this.g.destroy();
    this.g = this.dibujar(this.scene, this.celda[0], this.celda[1], this.estado, this.pos);
    this.g.setData('estado', this.estado);
    this.brillo.setDepth(this.g.depth + 0.2);
  }

  // Coloca la vista en una celda sin animar (reintento tras un deadlock).
  colocar(celda) {
    this.celda = celda;
    const p = aPantalla(celda[0], celda[1]);
    this.pos = { x: p.x + this.origen.x, y: p.y + this.origen.y };
    this.zona.setPosition(this.pos.x, this.pos.y - 18);
    this.redibujar();
  }

  // Mueve la vista a otra celda con una animación corta (el vagón sigue al token).
  moverA(celda, duracion = 350) {
    const antes = { ...this.pos };
    this.celda = celda;
    const p = aPantalla(celda[0], celda[1]);
    this.pos = { x: p.x + this.origen.x, y: p.y + this.origen.y };
    this.zona.setPosition(this.pos.x, this.pos.y - 18);
    this.redibujar();
    this.g.setPosition(antes.x - this.pos.x, antes.y - this.pos.y);
    this.scene.tweens.add({ targets: this.g, x: 0, y: 0, duration: duracion, ease: 'Sine.easeInOut' });
  }

  resaltar(si) {
    this.brillo.clear();
    if (!si) return;
    const { x, y } = this.pos;
    this.brillo.fillStyle(0xffffff, 0.2);
    this.brillo.fillPoints([{ x, y: y - 16 }, { x: x + 32, y }, { x, y: y + 16 }, { x: x - 32, y }], true);
    this.brillo.lineStyle(2, 0xffffff, 0.85);
    this.brillo.strokePoints([{ x, y: y - 16 }, { x: x + 32, y }, { x, y: y + 16 }, { x: x - 32, y }], true);
  }

  destruir() {
    if (this.g) this.g.destroy();
    this.zona.destroy();
    this.brillo.destroy();
  }
}
