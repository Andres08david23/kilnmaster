import test from 'node:test';
import assert from 'node:assert/strict';
import { componer, supervisor } from '../src/sed/composicion.js';
import { Automata } from '../src/sed/automata.js';
import { Observador } from '../src/sed/observador.js';
import { Aleatorio } from '../src/sed/aleatorio.js';
import { cargar } from './helpers.js';

const vagon = cargar('vagon');
const maquina = cargar('maquina_simple');

test('composición sin eventos comunes: producto de estados (3 x 3 = 9)', () => {
  const m2 = { ...maquina, nombre: 'M2', eventos: maquina.eventos.map((e) => ({ ...e, id: e.id + '2' })),
    transiciones: maquina.transiciones.map(([a, e, b]) => [a, e + '2', b]) };
  const c = componer(maquina, m2);
  assert.equal(c.estados.length, 9);
  assert.equal(c.inicial, 'Lista|Lista');
  assert.deepEqual(c.marcados, ['Lista|Lista']);
});

test('composición con evento común: ocurre a la vez en los dos autómatas', () => {
  const a = { nombre: 'A', estados: ['a0', 'a1'], inicial: 'a0', marcados: ['a0'], eventos: [{ id: 's', codigo: 's', controlable: true, observable: true }], transiciones: [['a0', 's', 'a1']] };
  const b = { nombre: 'B', estados: ['b0', 'b1'], inicial: 'b0', marcados: ['b1'], eventos: [{ id: 's', codigo: 's', controlable: true, observable: true }, { id: 'p', codigo: 'p', controlable: true, observable: true }], transiciones: [['b0', 's', 'b1'], ['b0', 'p', 'b0']] };
  const c = componer(a, b);
  assert.deepEqual(c.estados.sort(), ['a0|b0', 'a1|b1']);
  assert.ok(c.transiciones.some(([x, e, y]) => x === 'a0|b0' && e === 's' && y === 'a1|b1'));
  // p es privado de B: ocurre sin mover a A (a0 se queda en a0)
  assert.ok(c.transiciones.some(([x, e, y]) => x === 'a0|b0' && e === 'p' && y === 'a0|b0'));
});

test('supervisor de secuencia: deshabilita cocer en Crudo y enfriar en Precalentado, con la razón formal', () => {
  const s = supervisor(vagon, ['Quebrado']);
  assert.equal(s.permitido('Crudo', 'cocer'), false);
  assert.equal(s.permitido('Precalentado', 'enfriar'), false);
  assert.equal(s.permitido('Crudo', 'precalentar'), true);
  assert.equal(s.permitido('Cocido', 'cocer'), true);
  assert.match(s.razon('Crudo', 'cocer'), /δ\(Crudo, cocer\) = Quebrado/);
  assert.equal(s.malos.size, 1); // todos los eventos son controlables: solo Quebrado es malo
});

test('supervisor: un evento no controlable hacia un estado prohibido vuelve malo el estado de origen', () => {
  const m = { nombre: 'X', estados: ['a', 'b', 'c'], inicial: 'a', marcados: ['a'],
    eventos: [{ id: 'u', codigo: 'u', controlable: false, observable: true }, { id: 'c', codigo: 'c', controlable: true, observable: true }],
    transiciones: [['a', 'c', 'b'], ['b', 'u', 'c']] };
  const s = supervisor(m, ['c']);
  assert.ok(s.malos.has('b'));
  assert.equal(s.permitido('a', 'c'), false); // evitar b
});

test('10 000 eventos aleatorios con el supervisor activo nunca llegan a Quebrado', () => {
  const s = supervisor(vagon, ['Quebrado']);
  const g = new Automata(vagon);
  const az = new Aleatorio(2026);
  let ejecutados = 0;
  for (let i = 0; i < 10000; i++) {
    // el jugador intenta cualquier evento de Σ, incluso los que no tienen δ o están deshabilitados
    const ev = az.elegir(vagon.eventos).id;
    if (!g.puede(ev) || !s.permitido(g.estado, ev)) continue;
    g.ejecutar(ev); ejecutados++;
    assert.notEqual(g.estado, 'Quebrado');
  }
  assert.ok(ejecutados > 1000);
});

test('sin supervisor sí se llega a Quebrado (control)', () => {
  const g = new Automata(vagon);
  const az = new Aleatorio(2026);
  let quebrado = false;
  for (let i = 0; i < 1000 && !quebrado; i++) {
    const ev = az.elegir(vagon.eventos).id;
    if (g.puede(ev)) { g.ejecutar(ev); quebrado = g.estado === 'Quebrado'; }
  }
  assert.ok(quebrado);
});

test('observador con un evento no observable: la estimación contiene el estado real', () => {
  const m = { nombre: 'Maq', estados: ['Lista', 'Operando', 'Falla'], inicial: 'Lista', marcados: ['Lista'],
    eventos: [{ id: 'iniciar', codigo: 'I', controlable: true, observable: true }, { id: 'terminar', codigo: 'T', controlable: false, observable: true },
      { id: 'fallar', codigo: 'F', controlable: false, observable: false }, { id: 'reparar', codigo: 'R', controlable: true, observable: true }],
    transiciones: [['Lista', 'iniciar', 'Operando'], ['Operando', 'terminar', 'Lista'], ['Operando', 'fallar', 'Falla'], ['Falla', 'reparar', 'Lista']] };
  const az = new Aleatorio(5);
  for (let seq = 0; seq < 1000; seq++) {
    const real = new Automata(m);
    const obs = new Observador(m);
    for (let paso = 0; paso < 8; paso++) {
      const posibles = real.eventosActivos();
      const ev = az.elegir(posibles);
      real.ejecutar(ev);
      if (m.eventos.find((e) => e.id === ev).observable) obs.observar(ev);
      assert.ok(obs.estimacion().includes(real.estado), `secuencia ${seq}: ${real.estado} no está en ${obs.estimacion()}`);
    }
  }
  assert.ok(new Observador(m).construir().estados.length >= 2);
});
