import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulacion } from '../src/juego/Simulacion.js';

function correr(sim, segundos, paso = 0.25) {
  for (let t = 0; t < segundos; t += paso) sim.avanzar(paso);
}

test('2 minutos de simulación sin intervenir: las máquinas trabajan y producen', () => {
  const sim = new Simulacion({ semilla: 1, autoReparar: true });
  sim.iniciar();
  correr(sim, 120);
  const total = [...sim.maquinas.values()].reduce((s, m) => s + m.terminados, 0);
  assert.ok(total > 10, `producción baja: ${total}`);
  assert.ok(sim.registro.length > 20);
});

test('toda transición de una máquina está en δ: ninguna máquina cambia de estado fuera del modelo', () => {
  const sim = new Simulacion({ semilla: 3, autoReparar: true });
  sim.iniciar();
  correr(sim, 300);
  for (const r of sim.registro) {
    const e = sim.entidad(r.entidad);
    assert.equal(e.automata.siguiente(r.evento, r.de), r.a, `${r.entidad}: δ(${r.de}, ${r.evento}) ≠ ${r.a}`);
  }
  // el estado final coincide con el último registro de cada máquina
  for (const m of sim.maquinas.values()) {
    const ult = [...sim.registro].reverse().find((r) => r.entidad === m.id);
    assert.equal(m.automata.estado, ult.a);
  }
});

test('la misma semilla reproduce la misma partida', () => {
  const a = new Simulacion({ semilla: 42, autoReparar: true }); a.iniciar(); correr(a, 200);
  const b = new Simulacion({ semilla: 42, autoReparar: true }); b.iniciar(); correr(b, 200);
  assert.deepEqual(a.registro, b.registro);
  const c = new Simulacion({ semilla: 43, autoReparar: true }); c.iniciar(); correr(c, 200);
  assert.notDeepEqual(a.registro, c.registro);
});

test('ocurren fallas (eventos no controlables) y la máquina espera la reparación del jugador', () => {
  const sim = new Simulacion({ semilla: 5, turno: 3 }); // sin autoReparar
  sim.iniciar();
  correr(sim, 200);
  const falla = [...sim.maquinas.values()].find((m) => m.automata.estado === 'Falla');
  assert.ok(falla, 'debería haber una máquina en Falla');
  const r = sim.solicitar(falla.id, 'reparar');
  assert.equal(r.ok, true);
  assert.equal(falla.automata.estado, 'Lista');
});

test('solicitar un evento no controlable o sin δ se rechaza y no cambia el estado', () => {
  const sim = new Simulacion({ semilla: 1 });
  const m = sim.maquinas.get('molienda');
  let r = sim.solicitar('molienda', 'terminar'); // desde Lista no hay δ
  assert.equal(r.ok, false);
  sim.solicitar('molienda', 'iniciar');
  r = sim.solicitar('molienda', 'fallar'); // no controlable
  assert.equal(r.ok, false);
  assert.match(r.razon, /no es controlable/);
  assert.equal(m.automata.estado, 'Operando');
});

test('hay 5 vagones, cada uno con su autómata en Crudo', () => {
  const sim = new Simulacion();
  assert.equal(sim.vagones.length, 5);
  for (const v of sim.vagones) assert.equal(v.automata.estado, 'Crudo');
});
