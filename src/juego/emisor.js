// Emisor de eventos mínimo (sin dependencias). Lo usa la simulación para avisar a las vistas.
export class Emisor {
  constructor() { this.oyentes = new Map(); }

  on(nombre, fn) {
    if (!this.oyentes.has(nombre)) this.oyentes.set(nombre, []);
    this.oyentes.get(nombre).push(fn);
    return () => this.off(nombre, fn);
  }

  off(nombre, fn) {
    const l = this.oyentes.get(nombre);
    if (l) this.oyentes.set(nombre, l.filter((f) => f !== fn));
  }

  emit(nombre, ...args) {
    for (const fn of this.oyentes.get(nombre) || []) fn(...args);
  }
}
