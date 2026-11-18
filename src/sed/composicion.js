// Composición síncrona G1 ‖ G2 y supervisor de estados prohibidos (Ramadge y Wonham).

// Producto síncrono: los eventos comunes ocurren a la vez en ambos autómatas; los privados, por separado.
export function componer(g1, g2) {
  const ids1 = new Set(g1.eventos.map((e) => e.id));
  const ids2 = new Set(g2.eventos.map((e) => e.id));
  const t1 = new Map(), t2 = new Map();
  for (const [de, ev, a] of g1.transiciones) { const k = `${de}|${ev}`; t1.set(k, a); }
  for (const [de, ev, a] of g2.transiciones) { const k = `${de}|${ev}`; t2.set(k, a); }
  const eventos = [...g1.eventos];
  for (const e of g2.eventos) if (!ids1.has(e.id)) eventos.push(e);
  const nombre = (a, b) => `${a}|${b}`;
  const inicial = nombre(g1.inicial, g2.inicial);
  const vistos = new Set([inicial]);
  const cola = [[g1.inicial, g2.inicial]];
  const transiciones = [];
  while (cola.length) {
    const [a, b] = cola.shift();
    for (const e of eventos) {
      const en1 = ids1.has(e.id), en2 = ids2.has(e.id);
      let a2 = a, b2 = b, ok = true;
      if (en1) { const x = t1.get(`${a}|${e.id}`); if (x === undefined) ok = false; else a2 = x; }
      if (en2) { const y = t2.get(`${b}|${e.id}`); if (y === undefined) ok = false; else b2 = y; }
      if (!ok) continue;
      transiciones.push([nombre(a, b), e.id, nombre(a2, b2)]);
      const n = nombre(a2, b2);
      if (!vistos.has(n)) { vistos.add(n); cola.push([a2, b2]); }
    }
  }
  const estados = [...vistos];
  const marcados = estados.filter((s) => {
    const [x, y] = s.split('|');
    return g1.marcados.includes(x) && g2.marcados.includes(y);
  });
  return { nombre: `${g1.nombre} ‖ ${g2.nombre}`, estados, inicial, marcados, eventos, transiciones };
}

// Supervisor: calcula los estados malos (los prohibidos y los que llegan a ellos por eventos no
// controlables) y, para cada estado, los eventos controlables que hay que deshabilitar con su razón.
// prohibidos: lista de estados o función (estado) => boolean.
export function supervisor(modelo, prohibidos) {
  const esProhibido = typeof prohibidos === 'function' ? prohibidos : (q) => prohibidos.includes(q);
  const controlable = new Map(modelo.eventos.map((e) => [e.id, e.controlable]));
  const malos = new Set(modelo.estados.filter(esProhibido));
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const [de, ev, a] of modelo.transiciones) {
      if (!malos.has(de) && malos.has(a) && !controlable.get(ev)) { malos.add(de); cambio = true; }
    }
  }
  const deshabilitados = new Map(); // estado -> [{ evento, razon }]
  for (const q of modelo.estados) {
    if (malos.has(q)) continue;
    const lista = [];
    for (const [de, ev, a] of modelo.transiciones) {
      if (de === q && controlable.get(ev) && malos.has(a)) {
        lista.push({ evento: ev, razon: `δ(${q}, ${ev}) = ${a} ∈ estados prohibidos` });
      }
    }
    if (lista.length) deshabilitados.set(q, lista);
  }
  return {
    malos,
    deshabilitados,
    // ¿Puede el jugador ejecutar este evento en este estado con el supervisor activo?
    permitido(q, evento) {
      const l = deshabilitados.get(q);
      return !(l && l.some((d) => d.evento === evento));
    },
    razon(q, evento) {
      const l = deshabilitados.get(q);
      const d = l && l.find((x) => x.evento === evento);
      return d ? d.razon : null;
    },
  };
}
