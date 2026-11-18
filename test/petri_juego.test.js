import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Simulacion } from '../src/juego/Simulacion.js';

test('M0: vagon1..5 en Z1..Z4,R1 y solo t_avanzar_R1 habilitada', () => {
  const s = new Simulacion();
  assert.equal(s.vagonEn('Z1').id, 'vagon1');
  assert.equal(s.vagonEn('R1').id, 'vagon5');
  assert.equal(s.vagonEn('R2'), null);
  assert.deepEqual(s.red.habilitadas().map((i) => s.red.transiciones[i].nombre), ['t_avanzar_R1']);
});

test('avanzar sigue el token y respeta el AND-join', () => {
  const s = new Simulacion();
  const r = s.solicitarTransicion('t_avanzar_Z1');
  assert.equal(r.ok, false);
  assert.match(r.razon, /Libre_Z2/);
  assert.equal(s.solicitarTransicion('t_avanzar_R1').ok, true);
  assert.equal(s.vagonEn('R2').id, 'vagon5');
  assert.equal(s.solicitarTransicion('t_avanzar_Z4').ok, true);
  assert.equal(s.vagonEn('R1').id, 'vagon4');
});

test('con supervisor (N2) agregar vagón siempre se bloquea por Cupo y cuesta 5 puntos', () => {
  const s = new Simulacion();
  s.solicitarTransicion('t_avanzar_R1');
  const r = s.solicitarTransicion('t_agregar_vagon');
  assert.equal(r.ok, false);
  assert.match(r.razon, /Cupo = 0/);
  assert.equal(s.puntos, -5);
  assert.equal(s.vagones.length, 5);
});

test('modo manual (N1): R1, agregar → deadlock', () => {
  const s = new Simulacion({ supervisor: false });
  let dead = null;
  s.on('deadlock', (d) => { dead = d; });
  s.solicitarTransicion('t_avanzar_R1');
  assert.equal(s.red.conflictos().length, 1); // t_avanzar_Z4 y t_agregar_vagon compiten por Libre_R1
  assert.equal(s.solicitarTransicion('t_agregar_vagon').ok, true);
  assert.equal(s.vagones.length, 6);
  assert.ok(dead);
  assert.deepEqual(dead.secuencia, ['t_avanzar_R1', 't_agregar_vagon']);
  assert.equal(s.solicitarTransicion('t_avanzar_Z1').ok, false);
});

test('con supervisor ningún orden de disparos llega a deadlock (5000 disparos al azar)', () => {
  const s = new Simulacion();
  let semilla = 7;
  const az = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
  const ts = s.red.transiciones.map((t) => t.nombre);
  for (let i = 0; i < 5000; i++) { s.solicitarTransicion(ts[Math.floor(az() * ts.length)]); assert.equal(s.bloqueada, null); }
  assert.equal(s.vagones.length, 5);
  assert.equal(s.red.M.slice(0, 6).reduce((a, b) => a + b, 0), 5); // invariante: 5 vagones en el circuito
});

test('cambiar de modo conserva el marcado', () => {
  const s = new Simulacion();
  s.solicitarTransicion('t_avanzar_R1');
  const antes = s.red.M.slice(0, 13);
  s.setSupervisor(false);
  assert.deepEqual(s.red.M, antes);
  s.setSupervisor(true);
  assert.deepEqual(s.red.M.slice(0, 13), antes);
  assert.equal(s.red.M[13], 0);
});

test('radar: verde con supervisor, amarillo en manual con 2 disparos al deadlock, rojo en deadlock', () => {
  const a = new Simulacion();
  assert.equal(a.colorRadar(), 'verde');
  const b = new Simulacion({ supervisor: false });
  assert.equal(b.colorRadar(), 'amarillo');
  b.solicitarTransicion('t_avanzar_R1');
  b.solicitarTransicion('t_agregar_vagon');
  assert.equal(b.colorRadar(), 'rojo');
});

test('probarDisparo no cambia el marcado y calcula M_k = M_{k-1} + Aᵀu', () => {
  const s = new Simulacion();
  const antes = [...s.red.M];
  const r = s.probarDisparo('t_avanzar_R1');
  assert.deepEqual(s.red.M, antes);
  assert.equal(r.habilitada, true);
  assert.deepEqual(r.Mk, antes.map((m, p) => m + r.ATu[p]));
  assert.equal(s.probarDisparo('t_avanzar_Z1').habilitada, false);
});

test('reintentar vuelve al último marcado verde y reanuda', () => {
  const s = new Simulacion({ supervisor: false });
  s.solicitarTransicion('t_avanzar_R1'); // amarillo: el verde sigue siendo M0
  s.solicitarTransicion('t_agregar_vagon');
  assert.ok(s.bloqueada);
  s.reintentar(true);
  assert.equal(s.bloqueada, null);
  assert.equal(s.vagones.length, 5);
  assert.equal(s.supervisorActivo, true);
  assert.equal(s.colorRadar(), 'verde');
  assert.equal(s.solicitarTransicion('t_avanzar_R1').ok, true);
});

test('turno: termina a los 180 s, compara con la meta y emite logros', () => {
  const s = new Simulacion({ autoReparar: true });
  let fin = null;
  s.on('finTurno', (d) => { fin = d; });
  s.iniciar();
  for (let i = 0; i < 190; i++) s.avanzar(1);
  assert.ok(fin);
  assert.equal(fin.turno, 1);
  assert.equal(fin.meta, 400);
  assert.equal(fin.exito, fin.puntos >= 400);
  assert.equal(s.terminado, true);
});

test('logros: supervisor probado, primer lote y receta perfecta', () => {
  const s = new Simulacion();
  s.solicitar('vagon1', 'cocer'); // bloqueado
  assert.ok(s.logros.has('supervisorProbado'));
  const v = s.entidad('vagon2');
  s.setSupervisor(false);
  s.solicitar('vagon2', 'cocer'); // Z... Crudo → Quebrado
  assert.equal(v.automata.estado, 'Quebrado');
  s.repararVagon('vagon2', 'PCE');
  assert.ok(s.logros.has('recetaPerfecta'));
  s.solicitar('vagon2', 'descargar');
  assert.ok(s.logros.has('primerLote'));
});

test('cocción: dura lo que dice el turno y bloquea enfriar hasta que termina', () => {
  const s = new Simulacion();
  s.solicitar('vagon1', 'precalentar');
  assert.equal(s.solicitar('vagon1', 'cocer').ok, true);
  const r = s.solicitar('vagon1', 'enfriar');
  assert.equal(r.ok, false);
  assert.match(r.razon, /cocción en curso/);
  s.avanzar(6.1);
  assert.equal(s.solicitar('vagon1', 'enfriar').ok, true);
});

test('zonas: cada evento del vagón solo se ejecuta en su zona y una vuelta completa da un lote', () => {
  const s = new Simulacion({ zonas: true });
  const r = s.solicitar('vagon2', 'precalentar'); // vagon2 está en Z2
  assert.equal(r.ok, false);
  assert.match(r.razon, /precalentar se ejecuta en Z1/);
  assert.equal(s.solicitar('vagon1', 'precalentar').ok, true); // vagon1 en Z1
  assert.equal(s.fueraDeZona('vagon5', 'descargar'), null); // vagon5 en R1
  // mover el circuito hasta que vagon1 llegue a Z2: R1→R2, Z4→R1, Z3→Z4, Z2→Z3, Z1→Z2
  for (const t of ['t_avanzar_R1', 't_avanzar_Z4', 't_avanzar_Z3', 't_avanzar_Z2', 't_avanzar_Z1']) assert.equal(s.solicitarTransicion(t).ok, true);
  assert.equal(s.posicion.get('vagon1'), 'Z2');
  assert.equal(s.solicitar('vagon1', 'cocer').ok, true);
});
