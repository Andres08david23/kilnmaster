// Gestor de entrada: mouse, teclado y táctil producen las MISMAS acciones.
// Emite: 'seleccionar'(idEntidad), 'solicitarEvento'(idEntidad, evento), 'solicitarTransicion'(t_avanzar_X | t_agregar_vagon), 'pausa', 'inspector',
// 'velocidad'(1|2|4), 'supervisor' (tecla M: modo manual) y 'cerrar'. Las escenas escuchan estas acciones; nunca leen el teclado por su cuenta.
export class GestorEntrada extends Phaser.Events.EventEmitter {
  // Mientras la consola de reparación recibe texto, los atajos P, I, 1, 2 y 4 se ignoran (Esc sigue cerrando).
  bloqueado = false;

  // Conecta las teclas de una escena: P pausa, I inspector, 1, 2 y 4 velocidad, Esc cerrar.
  conectarTeclado(scene) {
    const kb = scene.input.keyboard;
    const libre = (f) => () => { if (!this.bloqueado) f(); };
    const mapa = [
      ['P', libre(() => this.pausa())],
      ['I', libre(() => this.inspector())],
      ['ONE', libre(() => this.velocidad(1))],
      ['TWO', libre(() => this.velocidad(2))],
      ['FOUR', libre(() => this.velocidad(4))],
      ['M', libre(() => this.supervisor())],
      ['ESC', () => this.cerrar()],
    ];
    for (const [tecla, accion] of mapa) kb.addKey(tecla).on('down', accion);
  }

  seleccionar(idEntidad) { this.emit('seleccionar', idEntidad); }
  solicitarEvento(idEntidad, evento) { this.emit('solicitarEvento', idEntidad, evento); }
  solicitarTransicion(nombre) { this.emit('solicitarTransicion', nombre); }
  pausa() { this.emit('pausa'); }
  inspector() { this.emit('inspector'); }
  velocidad(v) { this.emit('velocidad', v); }
  supervisor() { this.emit('supervisor'); }
  cerrar() { this.emit('cerrar'); }
}
