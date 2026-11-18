import test from 'node:test';
import assert from 'node:assert/strict';
import { Automata } from '../src/sed/automata.js';
import { cargar } from './helpers.js';

const vagon = cargar('vagon');
const maquina = cargar('maquina_simple');

// Palabras de la tabla de JFLAP (docs/modelo/automatas.md). Acepta si termina en Crudo.
const VAGON = [
  ['PCED', true], ['PCCED', true], ['PCEDPCED', true], ['CL', true],
  ['PC', false], ['PCE', false], ['C', false], ['PE', false],
];
for (const [w, esperado] of VAGON) {
  test(`vagón: ${w || 'vacía'} ${esperado ? 'se acepta' : 'se rechaza'}`, () => {
    assert.equal(new Automata(vagon).acepta(w), esperado);
  });
}

const MAQUINA = [['ITIT', true], ['IFR', true], ['IFRIT', true], ['', true], ['I', false], ['IF', false], ['IFRI', false], ['T', false]];
for (const [w, esperado] of MAQUINA) {
  test(`máquina simple: ${w || 'vacía'} ${esperado ? 'se acepta' : 'se rechaza'}`, () => {
    assert.equal(new Automata(maquina).acepta(w), esperado);
  });
}

test('el vagón es determinista: ningún (estado, evento) se repite', () => {
  const vistos = new Set();
  for (const [de, ev] of vagon.transiciones) {
    const k = `${de}|${ev}`;
    assert.ok(!vistos.has(k), `transición repetida ${k}`);
    vistos.add(k);
  }
});

test('ejecutar usa solo δ: sigue la secuencia normal y guarda el historial', () => {
  const g = new Automata(vagon);
  g.ejecutar('precalentar'); g.ejecutar('cocer'); g.ejecutar('cocer'); g.ejecutar('enfriar');
  assert.equal(g.estado, 'Enfriado');
  g.ejecutar('descargar');
  assert.equal(g.estado, 'Crudo');
  assert.equal(g.esMarcado(), true);
  assert.equal(g.palabra(), 'PCCED');
});

test('ejecutar lanza error si δ no está definida y no cambia el estado', () => {
  const g = new Automata(vagon);
  assert.throws(() => g.ejecutar('descargar'), /no está definida/);
  assert.equal(g.estado, 'Crudo');
  assert.equal(g.historial.length, 0);
});

test('eventosActivos devuelve Γ(q)', () => {
  const g = new Automata(vagon);
  assert.deepEqual(g.eventosActivos().sort(), ['cocer', 'precalentar']);
  g.ejecutar('precalentar');
  assert.deepEqual(g.eventosActivos().sort(), ['cocer', 'enfriar']);
});

test('choque térmico: cocer desde Crudo y enfriar desde Precalentado llevan a Quebrado; limpiar_vagon lo repara', () => {
  const g = new Automata(vagon);
  g.ejecutar('cocer');
  assert.equal(g.estado, 'Quebrado');
  g.ejecutar('limpiar_vagon');
  assert.equal(g.estado, 'Crudo');
  g.ejecutar('precalentar'); g.ejecutar('enfriar');
  assert.equal(g.estado, 'Quebrado');
});

test('cocer en Cocido admite repetir', () => {
  const g = new Automata(vagon);
  g.ejecutar('precalentar'); g.ejecutar('cocer');
  g.ejecutar('cocer'); g.ejecutar('cocer');
  assert.equal(g.estado, 'Cocido');
});
