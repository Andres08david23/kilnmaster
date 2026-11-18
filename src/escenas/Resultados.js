// Pantalla de resultados al final del turno: producción, fallas, intentos bloqueados, quebrados, deadlocks evitados,
// puntaje frente a la meta y los 6 logros. Desde aquí se pasa al turno siguiente, se reintenta o se vuelve al título.
import { ANCHO, ALTO, TURNOS } from '../config.js';
import { LOGROS } from '../juego/Simulacion.js';
import { PALETA } from '../arte/paleta.js';

const F = (px, color = '#cfd3d8') => ({ fontFamily: 'monospace', fontSize: `${px}px`, color });

export class Resultados extends Phaser.Scene {
  constructor() { super('Resultados'); }

  init(d) { this.d = d || { turno: 1, puntos: 0, meta: 400, exito: false, produccion: 0, fallasReparadas: 0, intentosBloqueados: 0, quebrados: 0, deadlocksEvitados: 0, logros: [] }; }

  create() {
    this.cameras.main.fadeIn(400, 28, 26, 30);
    const d = this.d;
    const victoria = d.exito && d.turno === TURNOS;
    this.add.rectangle(ANCHO / 2, ALTO / 2, ANCHO, ALTO, 0x1c1a1e);
    this.add.text(ANCHO / 2, 40, victoria ? '¡Victoria! Completaste los 3 turnos' : `Resultados del turno ${d.turno}`, F(26, '#f1ece4')).setOrigin(0.5);
    this.add.text(ANCHO / 2, 78, d.exito ? `Meta cumplida: ${d.puntos} / ${d.meta} puntos` : `Meta no alcanzada: ${d.puntos} / ${d.meta} puntos`, F(16, d.exito ? '#7fd6a0' : '#ff9a9a')).setOrigin(0.5);
    const filas = [
      ['Producción (ciclos terminados)', d.produccion], ['Fallas reparadas', d.fallasReparadas], ['Intentos bloqueados', d.intentosBloqueados],
      ['Vagones quebrados', d.quebrados], ['Deadlocks evitados', d.deadlocksEvitados],
    ];
    filas.forEach(([k, v], i) => {
      this.add.text(90, 130 + i * 34, k, F(15));
      this.add.text(400, 130 + i * 34, String(v), F(15, '#ffffff'));
    });
    this.add.text(520, 124, 'Logros', F(16, '#ffd34a'));
    Object.entries(LOGROS).forEach(([clave, nombre], i) => {
      const ok = d.logros.includes(clave);
      this.add.text(520, 154 + i * 30, `${ok ? '★' : '☆'} ${nombre}`, F(14, ok ? '#ffd34a' : '#6b7480'));
    });
    const boton = (x, texto, color, fn) => {
      this.add.rectangle(x, 440, 250, 40, color).setInteractive({ useHandCursor: true }).on('pointerdown', fn);
      this.add.text(x, 440, texto, F(14, '#ffffff')).setOrigin(0.5);
    };
    const logros = this.registry.get('logros');
    if (d.exito && d.turno < TURNOS) boton(ANCHO / 2 - 140, `Siguiente turno (${d.turno + 1})`, 0x2e9e5b, () => this.scene.start('Planta', { turno: d.turno + 1 }));
    else boton(ANCHO / 2 - 140, `Reintentar turno ${d.turno}`, 0x3b7dd8, () => this.scene.start('Planta', { turno: d.turno }));
    boton(ANCHO / 2 + 140, 'Volver al título', 0x6b7480, () => { logros && logros.clear(); this.scene.start('Titulo'); });
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('Planta', { turno: d.exito && d.turno < TURNOS ? d.turno + 1 : d.turno }));
  }
}
