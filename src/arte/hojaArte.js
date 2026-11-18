// Hoja de arte: muestra la paleta, las máquinas por estado, los tokens, un trozo de planta y la maqueta del HUD.
// Teclas 1 a 5 (o toque en los botones de arriba) cambian de panel.
import { PALETA, COLOR_ESTADO, hex } from './paleta.js';
import { aPantalla } from './geom.js';
import { dibujarMolienda, dibujarExtrusora, dibujarCortadora, dibujarZonaHorno, dibujarVagon } from './maquinas.js';
import { dibujarSuelo, dibujarRiel, dibujarMuro } from './planta.js';
import { dibujarToken } from './iconos.js';
import { GrafoAutomata } from './hudAutomata.js';
import { dibujarRadar } from './radar.js';

const MODELO_VAGON = {
  estados: ['Crudo', 'Precalentado', 'Cocido', 'Enfriado', 'Quebrado'],
  inicial: 'Crudo',
  marcados: ['Crudo'],
  eventos: [
    { id: 'precalentar', codigo: 'P' }, { id: 'cocer', codigo: 'C' }, { id: 'enfriar', codigo: 'E' },
    { id: 'descargar', codigo: 'D' }, { id: 'limpiar_vagon', codigo: 'L' },
  ],
  transiciones: [
    ['Crudo', 'precalentar', 'Precalentado'], ['Crudo', 'cocer', 'Quebrado'],
    ['Precalentado', 'cocer', 'Cocido'], ['Precalentado', 'enfriar', 'Quebrado'],
    ['Cocido', 'cocer', 'Cocido'], ['Cocido', 'enfriar', 'Enfriado'],
    ['Enfriado', 'descargar', 'Crudo'], ['Quebrado', 'limpiar_vagon', 'Crudo'],
  ],
};
const LAYOUT_VAGON = { Crudo: [-150, 40], Precalentado: [-40, -40], Cocido: [90, -40], Enfriado: [150, 70], Quebrado: [-40, 110] };

const PANELES = ['Paleta', 'Máquinas por estado', 'Tokens', 'Planta 8x8', 'HUD y radar'];
const T = (scene, x, y, s, tam = 13, color = hex(PALETA.texto), origen = [0, 0]) =>
  scene.add.text(x, y, s, { fontFamily: 'monospace', fontSize: tam + 'px', color }).setOrigin(origen[0], origen[1]).setDepth(9000);

class HojaArte extends Phaser.Scene {
  create() {
    this.panel = 0;
    this.input.keyboard.on('keydown', (e) => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 5) this.mostrar(n - 1); });
    window.__panel = (n) => this.mostrar(n);
    this.mostrar(0);
  }

  mostrar(n) {
    this.panel = n;
    this.children.removeAll(true);
    this.add.rectangle(480, 270, 960, 540, PALETA.fondo).setDepth(-5000);
    PANELES.forEach((p, i) => {
      const x = 12 + i * 186;
      const b = this.add.rectangle(x + 88, 20, 176, 26, i === n ? PALETA.mantenimiento : PALETA.hud).setInteractive({ useHandCursor: true }).setDepth(9000);
      b.on('pointerdown', () => this.mostrar(i));
      this.add.text(x + 88, 20, `${i + 1}. ${p}`, { fontFamily: 'monospace', fontSize: '12px', color: '#fff' }).setOrigin(0.5).setDepth(9001);
    });
    [this.paleta, this.maquinas, this.tokens, this.planta, this.hud][n].call(this);
  }

  paleta() {
    const items = [
      ['operación', PALETA.operacion], ['espera', PALETA.espera], ['fallo', PALETA.fallo], ['mantenimiento', PALETA.mantenimiento],
      ['precalentado', PALETA.precalentado], ['cocido', PALETA.cocido], ['suelo', PALETA.suelo],
      ['muro', PALETA.muro], ['riel', PALETA.riel], ['metal', PALETA.metal], ['token vagón', PALETA.tokenVagon],
      ['token libre', PALETA.tokenLibre], ['token nuevo', PALETA.tokenNuevo], ['token cupo', PALETA.tokenCupo],
    ];
    items.forEach(([n, c], i) => {
      const x = 40 + (i % 5) * 180, y = 80 + Math.floor(i / 5) * 150;
      this.add.rectangle(x + 70, y + 40, 140, 80, c).setStrokeStyle(2, 0xffffff, 0.4);
      T(this, x, y + 88, `${n}\n${hex(c)}`, 13);
    });
    T(this, 40, 520, 'Luz desde arriba a la izquierda: cara izquierda más clara, derecha más oscura.', 12, '#aaaaaa');
  }

  maquinas() {
    T(this, 20, 56, 'Vagón (autómata de 5 estados)', 13);
    ['Crudo', 'Precalentado', 'Cocido', 'Enfriado', 'Quebrado'].forEach((e, i) => {
      const x = 110 + i * 185;
      dibujarVagon(this, 0, 0, e, { x, y: 130 });
      T(this, x, 170, e, 13, hex(COLOR_ESTADO.Vagon[e]), [0.5, 0]);
    });
    T(this, 20, 205, 'Molienda, extrusora y cortadora (Lista, Operando, Falla)', 13);
    const fns = [dibujarMolienda, dibujarExtrusora, dibujarCortadora];
    fns.forEach((fn, k) => ['Lista', 'Operando', 'Falla'].forEach((e, i) => {
      const x = 80 + (k * 3 + i) * 98;
      fn(this, 0, 0, e, { x, y: 320 });
      T(this, x, 342, e, 11, hex(COLOR_ESTADO.Maquina[e]), [0.5, 0]);
    }));
    T(this, 20, 375, 'Zonas del horno: temperatura de 0 a 1 (bloom y gradación de color en la fase de pulido)', 13);
    [0.1, 0.4, 0.75, 1].forEach((t, i) => {
      const x = 150 + i * 220;
      dibujarZonaHorno(this, 0, 0, t, { x, y: 470 });
      T(this, x, 495, `Z${i + 1} · temperatura ${t}`, 12, '#ddd', [0.5, 0]);
    });
  }

  tokens() {
    const tipos = [['Vagon', 'Vagon_X (caja)'], ['Libre', 'Libre_X (rombo hueco)'], ['Nuevo', 'Vagon_nuevo (caja con flecha)'], ['Cupo', 'Cupo (rayo)']];
    T(this, 20, 56, 'Cada tipo de token tiene forma y color propios. Tamaño real (escala 1), 1 unidad, 5 unidades y k = 6 unidades.', 12, '#bbb');
    const g = this.add.graphics();
    tipos.forEach(([tipo, nombre], i) => {
      const y = 120 + i * 100;
      T(this, 20, y - 8, nombre, 13);
      dibujarToken(g, tipo, 330, y, 1);
      for (let k = 0; k < 5; k++) dibujarToken(g, tipo, 480 + k * 28, y, 1);
      for (let k = 0; k < 6; k++) dibujarToken(g, tipo, 700 + k * 32, y, 1.3);
    });
    T(this, 300, 98, '1', 12, '#aaa'); T(this, 480, 98, '5', 12, '#aaa'); T(this, 700, 98, 'k = 6', 12, '#aaa');
  }

  planta() {
    const ox = 480, oy = 150;
    dibujarSuelo(this, 8, 8, ox, oy);
    for (let i = 0; i < 8; i++) { dibujarMuro(this, i, 0, ox, oy); dibujarMuro(this, 0, i, ox, oy); }
    // vía del horno (fila y = 3) con rieles
    for (let x = 1; x < 8; x++) dibujarRiel(this, x, 3, ox, oy);
    const celdas = [[1, 1, dibujarMolienda, 'Operando'], [3, 1, dibujarExtrusora, 'Lista'], [5, 1, dibujarCortadora, 'Falla']];
    celdas.forEach(([x, y, fn, e]) => { const p = aPantalla(x, y); fn(this, x, y, e, { x: p.x + ox, y: p.y + oy }); });
    [0.2, 0.5, 0.8, 1].forEach((t, i) => { const x = 3 + i, y = 3; const p = aPantalla(x, y); dibujarZonaHorno(this, x, y, t, { x: p.x + ox, y: p.y + oy }); });
    [[1, 'Crudo'], [2, 'Precalentado'], [7, 'Enfriado']].forEach(([x, e]) => { const p = aPantalla(x, 3); dibujarVagon(this, x, 3, e, { x: p.x + ox, y: p.y + oy }); });
    const p = aPantalla(6, 6); dibujarVagon(this, 6, 6, 'Quebrado', { x: p.x + ox, y: p.y + oy });
    T(this, 20, 56, 'Planta de 8x8 celdas (64x32 px), orden de profundidad por (x + y)', 12, '#bbb');
  }

  hud() {
    T(this, 20, 56, 'Maqueta del HUD de máquina: vagón en Crudo. «C» (cocer) en rojo: lo deshabilita el supervisor.', 12, '#bbb');
    this.add.rectangle(290, 235, 520, 320, PALETA.hud, 0.95).setStrokeStyle(2, 0x555555);
    const grafo = new GrafoAutomata(this, 290, 225, MODELO_VAGON, { colores: COLOR_ESTADO.Vagon, layout: LAYOUT_VAGON });
    grafo.setDeshabilitados(['cocer']);
    T(this, 60, 405, 'Eventos: [P precalentar]  [C cocer: bloqueado]  ', 12, '#ffffff');
    const g = this.add.graphics();
    g.fillStyle(PALETA.operacion, 1); g.fillRect(60, 428, 92, 22);
    g.fillStyle(PALETA.deshabilitado, 1); g.fillRect(160, 428, 92, 22);
    T(this, 106, 432, 'P', 12, '#fff', [0.5, 0]); T(this, 206, 432, 'C ✕', 12, '#fff', [0.5, 0]);
    // radar en sus 3 colores
    T(this, 600, 80, 'Radar del Árbol de Cobertura', 13);
    ['verde', 'amarillo', 'rojo'].forEach((e, i) => {
      dibujarRadar(g, 650 + i * 100, 160, e);
      T(this, 650 + i * 100, 200, e, 12, '#ddd', [0.5, 0]);
    });
    T(this, 600, 250, 'verde: sin marcados muertos a 3 disparos\namarillo parpadeante: hay uno\nrojo: marcado actual muerto', 12, '#bbb');
    T(this, 600, 340, 'Zonas del HUD de partida:\n arriba izq.: reloj y turno\n arriba centro: puntaje\n arriba der.: radar\n abajo izq.: tokens por lugar\n abajo der.: alertas', 12, '#bbb');
  }
}

new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game-container',
  width: 960,
  height: 540,
  backgroundColor: '#1c1a1e',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: HojaArte,
});
