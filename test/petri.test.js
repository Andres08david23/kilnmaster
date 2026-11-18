import test from 'node:test';
import assert from 'node:assert/strict';
import { RedPetri } from '../src/sed/redPetri.js';
import { arbolCobertura, explorar, colorRadar } from '../src/sed/cobertura.js';
import { Aleatorio } from '../src/sed/aleatorio.js';
import { cargar } from './helpers.js';

const n1 = () => new RedPetri(cargar('red_n1'));
const n2 = () => new RedPetri(cargar('red_n2'));
const POS = ['Z1', 'Z2', 'Z3', 'Z4', 'R1', 'R2'];

test('tamaño: N1 tiene 13 lugares y 7 transiciones; Pre y Post son |T| x |P|', () => {
  const r = n1();
  assert.equal(r.lugares.length, 13);
  assert.equal(r.transiciones.length, 7);
  assert.equal(r.pre.length, 7);
  assert.equal(r.pre[0].length, 13);
  assert.equal(r.post.length, 7);
});

test('M0 de N1: 5 vagones en el circuito, Libre_R2 y Vagon_nuevo', () => {
  const m = n1().marcado();
  for (const p of ['Z1', 'Z2', 'Z3', 'Z4', 'R1']) assert.equal(m[`Vagon_${p}`], 1);
  assert.equal(m.Vagon_R2, 0);
  assert.equal(m.Libre_R2, 1);
  assert.equal(m.Vagon_nuevo, 1);
});

test('A = Post − Pre, y la ecuación de estado M\' = M + Aᵀ·u coincide con disparar', () => {
  const r = n1();
  const A = r.A;
  for (let t = 0; t < A.length; t++) for (let p = 0; p < A[t].length; p++) assert.equal(A[t][p], r.post[t][p] - r.pre[t][p]);
  const esperado = r.siguienteMarcado(r.M, 't_avanzar_R1');
  r.disparar('t_avanzar_R1');
  assert.deepEqual(r.M, esperado);
});

test('AND-join: una transición sin sus tokens de entrada no se dispara', () => {
  const r = n1();
  assert.equal(r.habilitada('t_avanzar_Z1'), false); // Libre_Z2 = 0
  assert.throws(() => r.disparar('t_avanzar_Z1'), /no está habilitada/);
  const m = r.motivoBloqueo('t_avanzar_Z1');
  assert.equal(m.lugar, 'Libre_Z2');
  assert.equal(m.tipo, 'falta_token');
});

test('solo t_avanzar_R1 está habilitada en M0', () => {
  const r = n1();
  assert.deepEqual(r.habilitadas().map((i) => r.transiciones[i].nombre), ['t_avanzar_R1']);
});

test('deadlock de N1: t_avanzar_R1, t_agregar_vagon lleva al marcado muerto de PIPE2', () => {
  const r = n1();
  r.disparar('t_avanzar_R1');
  r.disparar('t_agregar_vagon');
  assert.equal(r.esMuerto(), true);
  const m = r.marcado();
  for (const p of POS) { assert.equal(m[`Vagon_${p}`], 1); assert.equal(m[`Libre_${p}`], 0); }
  assert.equal(m.Vagon_nuevo, 0);
});

test('conflicto: con Libre_R1 = 1, t_avanzar_Z4 y t_agregar_vagon compiten por Libre_R1', () => {
  const r = n1();
  r.disparar('t_avanzar_R1');
  const c = r.conflictos();
  assert.equal(c.length, 1);
  assert.deepEqual([c[0].t1, c[0].t2].sort(), ['t_agregar_vagon', 't_avanzar_Z4']);
  assert.deepEqual(c[0].lugares, ['Libre_R1']);
});

test('N2 (regla de prevención): t_agregar_vagon nunca se habilita y no hay deadlock', () => {
  const r = n2();
  r.disparar('t_avanzar_R1');
  assert.equal(r.habilitada('t_agregar_vagon'), false);
  assert.equal(r.motivoBloqueo('t_agregar_vagon').lugar, 'Cupo');
  const arbol = arbolCobertura(r);
  assert.equal(arbol.muertos.length, 0);
});

test('invariantes P: Vagon_X + Libre_X = 1 y la suma de vagones = 6, en 1000 disparos aleatorios con semilla', () => {
  for (const red of [n1(), n2()]) {
    const az = new Aleatorio(99);
    const idx = (n) => red.indiceP(n);
    let disparos = 0;
    for (let i = 0; i < 1000; i++) {
      const hab = red.habilitadas();
      if (!hab.length) break;
      red.disparar(az.elegir(hab));
      disparos++;
      for (const p of POS) assert.equal(red.M[idx(`Vagon_${p}`)] + red.M[idx(`Libre_${p}`)], 1);
      const suma = POS.reduce((s, p) => s + red.M[idx(`Vagon_${p}`)], 0) + red.M[idx('Vagon_nuevo')];
      assert.equal(suma, 6);
    }
    assert.ok(disparos > 0);
  }
});

test('N1 es 1-acotada (segura): ningún lugar supera 1 token en todo el espacio de estados', () => {
  const r = n1();
  const arbol = arbolCobertura(r);
  for (const n of arbol.nodos) for (const v of n.M) assert.ok(v <= 1);
});

test('árbol de cobertura de N1: 8 nodos (7 marcados distintos), 1 marcado muerto', () => {
  const arbol = arbolCobertura(n1());
  assert.equal(arbol.nodos.length, 8);
  assert.equal(new Set(arbol.nodos.map((n) => n.M.join(','))).size, 7);
  assert.equal(arbol.muertos.length, 1);
  assert.equal(arbol.nodos.filter((n) => n.tipo === 'duplicado').length, 1);
});

test('árbol de cobertura de N2: 7 nodos (6 marcados distintos), sin marcados muertos', () => {
  const arbol = arbolCobertura(n2());
  assert.equal(arbol.nodos.length, 7);
  assert.equal(new Set(arbol.nodos.map((n) => n.M.join(','))).size, 6);
  assert.equal(arbol.muertos.length, 0);
});

test('Karp y Miller pone ω en una red no acotada', () => {
  const red = new RedPetri({
    lugares: [{ id: 'p1', nombre: 'A', m0: 1, k: 1, capacidad: 'desborde' }, { id: 'p2', nombre: 'B', m0: 0, k: 1, capacidad: 'desborde' }],
    transiciones: [{ id: 't1', nombre: 'genera', disparo: 'automatica' }],
    pre: [[1, 0]], post: [[1, 1]],
  });
  const arbol = arbolCobertura(red);
  assert.ok(arbol.nodos.some((n) => n.M[1] === Infinity));
});

test('radar: verde, amarillo y rojo según el marcado (profundidad 3)', () => {
  const r = n1();
  // M0: hueco en R2 -> el deadlock está a 2 disparos
  assert.equal(colorRadar(r), 'amarillo');
  assert.equal(explorar(r, r.M, 3).distanciaAlMuerto, 2);
  // avanzar el hueco hasta Z3 (lejos del deadlock): verde
  r.disparar('t_avanzar_R1'); r.disparar('t_avanzar_Z4'); r.disparar('t_avanzar_Z3');
  assert.equal(colorRadar(r), 'verde');
  // volver a acercar el hueco a R1 y provocar el deadlock
  for (const t of ['t_avanzar_Z2', 't_avanzar_Z1', 't_avanzar_R2', 't_avanzar_R1']) r.disparar(t);
  assert.equal(colorRadar(r), 'amarillo');
  r.disparar('t_agregar_vagon');
  assert.equal(colorRadar(r), 'rojo');
});

test('con la regla de prevención (N2) el radar queda en verde', () => {
  const r = n2();
  assert.equal(colorRadar(r), 'verde');
  r.disparar('t_avanzar_R1');
  assert.equal(colorRadar(r), 'verde');
});
