import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulacion, PUNTOS } from '../src/juego/Simulacion.js';
import { Aleatorio } from '../src/sed/aleatorio.js';
import { componer, supervisor } from '../src/sed/composicion.js';
import { cargar } from './helpers.js';

test('con el supervisor activo, cocer desde Crudo no se ejecuta y se registra el intento', () => {
  const sim = new Simulacion();
  const r = sim.solicitar('vagon1', 'cocer');
  assert.equal(r.ok, false);
  assert.equal(r.bloqueado, true);
  assert.match(r.razon, /δ\(Crudo, cocer\) = Quebrado/);
  assert.equal(sim.entidad('vagon1').automata.estado, 'Crudo');
  assert.equal(sim.intentosBloqueados, 1);
  assert.equal(sim.puntos, PUNTOS.intentoBloqueado);
});

test('3 intentos de llegar al estado prohibido: nunca se alcanza Quebrado', () => {
  const sim = new Simulacion();
  for (let i = 0; i < 3; i++) sim.solicitar('vagon1', 'cocer');
  sim.solicitar('vagon2', 'precalentar');
  sim.solicitar('vagon2', 'enfriar'); // enfriar desde Precalentado también quiebra
  assert.equal(sim.intentosBloqueados, 4);
  for (const v of sim.vagones) assert.notEqual(v.automata.estado, 'Quebrado');
});

test('la secuencia normal PCCED no se ve afectada por el supervisor', () => {
  const sim = new Simulacion();
  for (const ev of ['precalentar', 'cocer', 'cocer', 'enfriar', 'descargar']) { sim.avanzar(10); assert.equal(sim.solicitar('vagon1', ev).ok, true); }
  assert.equal(sim.entidad('vagon1').automata.estado, 'Crudo');
  assert.equal(sim.intentosBloqueados, 0);
});

test('en modo manual el jugador puede forzar el evento y el vagón se quiebra', () => {
  const sim = new Simulacion();
  sim.setSupervisor(false);
  assert.deepEqual(sim.deshabilitados('vagon1'), []);
  assert.equal(sim.solicitar('vagon1', 'cocer').ok, true);
  assert.equal(sim.entidad('vagon1').automata.estado, 'Quebrado');
});

test('10 000 eventos aleatorios sobre los 5 vagones con el supervisor activo: Quebrado no se alcanza', () => {
  const sim = new Simulacion({ semilla: 8 });
  const az = new Aleatorio(77);
  const eventos = ['precalentar', 'cocer', 'enfriar', 'descargar', 'limpiar_vagon'];
  let ok = 0;
  for (let i = 0; i < 10000; i++) {
    const v = az.elegir(sim.vagones);
    sim.avanzar(0.5);
    if (sim.solicitar(v.id, az.elegir(eventos)).ok) ok++;
    assert.notEqual(v.automata.estado, 'Quebrado');
  }
  assert.ok(ok > 1000);
  assert.ok(sim.intentosBloqueados > 100);
});

test('composición vagón ‖ especificación: 4 estados alcanzables y sincronizados', () => {
  const sim = new Simulacion();
  assert.equal(sim.composicion.estados.length, 4);
  assert.ok(!sim.composicion.estados.some((s) => s.includes('Quebrado')));
  assert.equal(sim.estadoCompuesto('vagon1'), 'Crudo|Crudo');
});

test('el supervisor deshabilita exactamente lo que la especificación bloquea en la composición', () => {
  const vagon = cargar('vagon');
  const esp = cargar('vagon_especificacion');
  const comp = componer(vagon, esp);
  const sup = supervisor(vagon, ['Quebrado']);
  for (const q of vagon.estados) {
    if (q === 'Quebrado') continue;
    const enPlanta = vagon.transiciones.filter((t) => t[0] === q).map((t) => t[1]);
    const enComp = comp.transiciones.filter((t) => t[0] === `${q}|${q}`).map((t) => t[1]);
    const bloqueadosComp = enPlanta.filter((e) => !enComp.includes(e)).sort();
    const bloqueadosSup = (sup.deshabilitados.get(q) || []).map((d) => d.evento).sort();
    assert.deepEqual(bloqueadosSup, bloqueadosComp, `estado ${q}`);
  }
});
