import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulacion, PUNTOS } from '../src/juego/Simulacion.js';

function vagonQuebrado() {
  const sim = new Simulacion({ semilla: 1, supervisor: false }); // modo manual: se puede forzar el choque térmico
  sim.solicitar('vagon1', 'cocer'); // choque térmico desde Crudo
  assert.equal(sim.entidad('vagon1').automata.estado, 'Quebrado');
  return sim;
}

for (const w of ['PCE', 'PCCE', 'PCCCE']) {
  test(`la palabra válida ${w} repara el vagón (queda en Enfriado) y suma puntos`, () => {
    const sim = vagonQuebrado();
    const antes = sim.puntos;
    const r = sim.repararVagon('vagon1', w);
    assert.equal(r.ok, true);
    assert.equal(sim.entidad('vagon1').automata.estado, 'Enfriado');
    assert.equal(sim.puntos - antes, PUNTOS.repararVagon);
    // cada evento pasó por δ: limpiar_vagon y luego los de la palabra
    const ult = sim.registro.slice(-(w.length + 1)).map((x) => x.evento);
    assert.equal(ult[0], 'limpiar_vagon');
  });
}

for (const w of ['PE', 'PCCCCE', 'PC', '', 'CE']) {
  test(`la palabra inválida "${w}" no repara el vagón y resta puntos`, () => {
    const sim = vagonQuebrado();
    const antes = sim.puntos;
    const r = sim.repararVagon('vagon1', w);
    assert.equal(r.ok, false);
    assert.equal(sim.entidad('vagon1').automata.estado, 'Quebrado');
    assert.equal(sim.puntos - antes, PUNTOS.palabraInvalida);
  });
}

test('no se puede reparar un vagón que no está quebrado', () => {
  const sim = new Simulacion();
  assert.equal(sim.repararVagon('vagon1', 'PCE').ok, false);
});

test('quebrar un vagón resta 50 puntos y avisa; descargar un lote suma 100', () => {
  const sim = new Simulacion({ supervisor: false });
  const alertas = [];
  sim.on('alerta', (a) => alertas.push(a));
  sim.solicitar('vagon2', 'cocer');
  assert.equal(sim.puntos, PUNTOS.quebrado);
  assert.deepEqual(alertas, [{ tipo: 'quebrado', id: 'vagon2' }]);
  for (const ev of ['precalentar', 'cocer', 'enfriar', 'descargar']) { sim.avanzar(10); sim.solicitar('vagon3', ev); }
  assert.equal(sim.puntos, PUNTOS.quebrado + PUNTOS.lote);
});

test('la ayuda muestra la expresión regular y cuesta 20 puntos', () => {
  const sim = new Simulacion();
  assert.equal(sim.pedirAyuda(), '^PC{1,3}E$');
  assert.equal(sim.puntos, PUNTOS.ayuda);
});

test('limpiar_vagon no se puede ejecutar directamente: solo desde la consola con una palabra de L', () => {
  const sim = new Simulacion({ semilla: 1, supervisor: false });
  sim.solicitar('vagon1', 'cocer');
  const r = sim.solicitar('vagon1', 'limpiar_vagon');
  assert.equal(r.ok, false);
  assert.match(r.razon, /consola de reparación/);
  assert.equal(sim.entidad('vagon1').automata.estado, 'Quebrado');
});
