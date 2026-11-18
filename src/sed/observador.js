// Autómata observador: con eventos no observables Σuo, entrega el conjunto de estados posibles.
// (KilnMaster no tiene eventos no observables: este módulo se prueba con un caso sintético.)
export class Observador {
  constructor(modelo) {
    this.modelo = modelo;
    this.uo = new Set(modelo.eventos.filter((e) => !e.observable).map((e) => e.id));
    this.estimacionActual = this._alcanceUO(new Set([modelo.inicial]));
  }

  // Cierre de un conjunto de estados por eventos no observables.
  _alcanceUO(conjunto) {
    const res = new Set(conjunto);
    const pila = [...conjunto];
    while (pila.length) {
      const q = pila.pop();
      for (const [de, ev, a] of this.modelo.transiciones) {
        if (de === q && this.uo.has(ev) && !res.has(a)) { res.add(a); pila.push(a); }
      }
    }
    return res;
  }

  estimacion() {
    return [...this.estimacionActual].sort();
  }

  // Un evento observable σ: la estimación pasa a los estados posibles tras σ y el alcance no observable.
  observar(evento) {
    const sig = new Set();
    for (const [de, ev, a] of this.modelo.transiciones) {
      if (ev === evento && this.estimacionActual.has(de)) sig.add(a);
    }
    this.estimacionActual = this._alcanceUO(sig);
    return this.estimacion();
  }

  // Construye el observador completo (subconjuntos). Devuelve { estados, transiciones }.
  construir() {
    const clave = (s) => [...s].sort().join(',');
    const inicial = this._alcanceUO(new Set([this.modelo.inicial]));
    const vistos = new Map([[clave(inicial), inicial]]);
    const cola = [inicial];
    const transiciones = [];
    const observables = this.modelo.eventos.filter((e) => e.observable).map((e) => e.id);
    while (cola.length) {
      const s = cola.shift();
      for (const ev of observables) {
        const sig = new Set();
        for (const [de, e2, a] of this.modelo.transiciones) if (e2 === ev && s.has(de)) sig.add(a);
        if (!sig.size) continue;
        const cerrado = this._alcanceUO(sig);
        const k = clave(cerrado);
        if (!vistos.has(k)) { vistos.set(k, cerrado); cola.push(cerrado); }
        transiciones.push([clave(s), ev, k]);
      }
    }
    return { estados: [...vistos.keys()], transiciones };
  }
}
