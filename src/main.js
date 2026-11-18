// Punto de entrada. Phaser 4.2.1 se carga por CDN en index.html: aquí se usa el objeto global Phaser.
import { ANCHO, ALTO } from './config.js';
import { Arranque } from './escenas/Arranque.js';
import { Titulo } from './escenas/Titulo.js';
import { Planta } from './escenas/Planta.js';
import { HUDMaquina } from './escenas/HUDMaquina.js';
import { Inspector } from './escenas/Inspector.js';
import { Resultados } from './escenas/Resultados.js';

const juego = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game-container',
  width: ANCHO,
  height: ALTO,
  backgroundColor: '#000000',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Arranque, Titulo, Planta, HUDMaquina, Inspector, Resultados],
});

window.__juego = juego; // útil para depurar en la consola del navegador
