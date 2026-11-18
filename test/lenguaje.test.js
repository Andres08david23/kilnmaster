import test from 'node:test';
import assert from 'node:assert/strict';
import { Lenguaje } from '../src/sed/lenguaje.js';
import { cargar } from './helpers.js';
import { Aleatorio } from '../src/sed/aleatorio.js';

const dfa = cargar('receta_termica');

// Tabla de JFLAP (docs/modelo/automatas.md)
const PALABRAS = [
  ['PCE', true], ['PCCE', true], ['PCCCE', true],
  ['PE', false], ['PCCCCE', false], ['PC', false], ['CE', false], ['PCCEE', false],
];
for (const [w, esperado] of PALABRAS) {
  test(`receta ${w}: ${esperado ? 'pertenece' : 'no pertenece'} a L`, () => {
    const l = new Lenguaje(dfa);
    const r = l.evaluar(w);
    assert.equal(r.pertenece, esperado);
    assert.equal(r.regex, r.dfa, 'RegExp y DFA deben coincidir');
  });
}

test('la RegExp y el DFA coinciden en 20 palabras al azar (con semilla)', () => {
  const l = new Lenguaje(dfa);
  const az = new Aleatorio(7);
  for (let i = 0; i < 20; i++) {
    const n = az.entero(0, 7);
    let w = '';
    for (let j = 0; j < n; j++) w += az.elegir(['P', 'C', 'E']);
    const r = l.evaluar(w);
    assert.equal(r.regex, r.dfa, `no coinciden en "${w}"`);
  }
});

test('avanzar muestra el progreso paso a paso y qué se esperaba', () => {
  const l = new Lenguaje(dfa);
  let r = l.avanzar('P');
  assert.deepEqual(r, { estado: 'q1', valido: true, esperados: ['C'], marcado: false });
  r = l.avanzar('C');
  assert.deepEqual(r.esperados.sort(), ['C', 'E']);
  r = l.avanzar('E');
  assert.equal(r.marcado, true);
});

test('avanzar con un símbolo sin transición lo marca inválido e indica lo esperado', () => {
  const l = new Lenguaje(dfa);
  l.avanzar('P');
  const r = l.avanzar('E');
  assert.equal(r.valido, false);
  assert.deepEqual(r.esperados, ['C']);
});
