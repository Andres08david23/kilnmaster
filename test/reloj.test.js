import test from 'node:test';
import assert from 'node:assert/strict';
import { Reloj } from '../src/sed/reloj.js';
import { Aleatorio } from '../src/sed/aleatorio.js';

test('tres eventos programados en desorden se disparan en orden de tiempo', () => {
  const r = new Reloj();
  const orden = [];
  r.programar(5, () => orden.push('c'));
  r.programar(1, () => orden.push('a'));
  r.programar(3, () => orden.push('b'));
  r.avanzar(10);
  assert.deepEqual(orden, ['a', 'b', 'c']);
  assert.equal(r.ahora, 10);
});

test('un evento posterior al avance no se dispara todavía', () => {
  const r = new Reloj();
  const orden = [];
  r.programar(2, () => orden.push('x'));
  r.programar(8, () => orden.push('y'));
  r.avanzar(5);
  assert.deepEqual(orden, ['x']);
  r.avanzar(5);
  assert.deepEqual(orden, ['x', 'y']);
});

test('con el mismo tiempo se respeta el orden en que se programaron', () => {
  const r = new Reloj();
  const orden = [];
  r.programar(2, () => orden.push(1));
  r.programar(2, () => orden.push(2));
  r.programar(2, () => orden.push(3));
  r.avanzar(2);
  assert.deepEqual(orden, [1, 2, 3]);
});

test('en pausa el reloj no avanza ni dispara eventos', () => {
  const r = new Reloj();
  let n = 0;
  r.programar(1, () => n++);
  r.pausar();
  r.avanzar(5);
  assert.equal(n, 0);
  assert.equal(r.ahora, 0);
  r.reanudar();
  r.avanzar(5);
  assert.equal(n, 1);
});

test('la misma semilla produce la misma secuencia aleatoria', () => {
  const a = new Aleatorio(123);
  const b = new Aleatorio(123);
  const sa = Array.from({ length: 20 }, () => a.siguiente());
  const sb = Array.from({ length: 20 }, () => b.siguiente());
  assert.deepEqual(sa, sb);
  const c = new Aleatorio(124);
  assert.notDeepEqual(sa, Array.from({ length: 20 }, () => c.siguiente()));
});
