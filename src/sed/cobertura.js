// Árbol de cobertura de Karp y Miller (ω = Infinity) y exploración a pocos disparos para el radar.

const claveM = (M) => M.map((x) => (x === Infinity ? 'w' : x)).join(',');

// Un nodo cubre a otro si es mayor o igual en todos los lugares.
const cubre = (M, ancestro) => ancestro.every((v, i) => v <= M[i]);

// Árbol de cobertura desde M0. Devuelve { nodos, aristas, muertos, truncado }.
// nodos[i] = { id, M, padre, via, tipo: 'nuevo' | 'duplicado' | 'muerto' }. Un 'duplicado' repite el marcado de un
// antecesor y no se expande. 'muerto' es un marcado sin sucesores (deadlock).
export function arbolCobertura(red, M0 = red.M0, maxNodos = 2000) {
  const nodos = [{ id: 0, M: [...M0], padre: null, via: null, tipo: 'nuevo' }];
  const aristas = [];
  const cola = [0];
  let truncado = false;
  const camino = (id) => {
    const res = [];
    for (let n = id; n !== null; n = nodos[n].padre) res.push(nodos[n]);
    return res;
  };
  while (cola.length) {
    const id = cola.shift();
    const nodo = nodos[id];
    const anc = camino(id);
    if (anc.slice(1).some((a) => claveM(a.M) === claveM(nodo.M))) { nodo.tipo = 'duplicado'; continue; }
    const hab = red.habilitadasEn(nodo.M);
    if (!hab.length) { nodo.tipo = 'muerto'; continue; }
    for (const t of hab) {
      if (nodos.length >= maxNodos) { truncado = true; break; }
      let M2 = nodo.M.map((m, p) => (m === Infinity ? Infinity : m + red.A[t][p]));
      for (const a of anc) {
        if (cubre(M2, a.M) && claveM(M2) !== claveM(a.M)) {
          M2 = M2.map((v, p) => (v > a.M[p] ? Infinity : v));
        }
      }
      const hijo = { id: nodos.length, M: M2, padre: id, via: t, tipo: 'nuevo' };
      nodos.push(hijo);
      aristas.push({ de: id, a: hijo.id, t });
      cola.push(hijo.id);
    }
  }
  return { nodos, aristas, muertos: nodos.filter((n) => n.tipo === 'muerto'), truncado };
}

// Exploración por amplitud desde el marcado M hasta `profundidad` disparos.
// Devuelve { marcados, muertoAlcanzable, distanciaAlMuerto, muertoActual }.
export function explorar(red, M, profundidad = 3) {
  const vistos = new Map([[claveM(M), 0]]);
  let frontera = [M];
  let distancia = red.esMuertoEn(M) ? 0 : null;
  for (let d = 1; d <= profundidad && frontera.length; d++) {
    const sig = [];
    for (const m of frontera) {
      for (const t of red.habilitadasEn(m)) {
        const m2 = red.siguienteMarcado(m, t);
        const k = claveM(m2);
        if (vistos.has(k)) continue;
        vistos.set(k, d);
        sig.push(m2);
        if (distancia === null && red.esMuertoEn(m2)) distancia = d;
      }
    }
    frontera = sig;
  }
  return {
    marcados: vistos.size,
    muertoAlcanzable: distancia !== null,
    distanciaAlMuerto: distancia,
    muertoActual: red.esMuertoEn(M),
  };
}

// Color del radar: 'rojo' si el marcado actual está muerto, 'amarillo' si hay un marcado muerto
// alcanzable en `profundidad` disparos, 'verde' en otro caso.
export function colorRadar(red, M = red.M, profundidad = 3) {
  const r = explorar(red, M, profundidad);
  if (r.muertoActual) return 'rojo';
  return r.muertoAlcanzable ? 'amarillo' : 'verde';
}
