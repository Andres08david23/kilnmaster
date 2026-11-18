// Reloj de simulación por eventos discretos con calendario de eventos futuros (cola de prioridad por tiempo).
// El tiempo avanza de evento en evento. Núcleo formal: sin motor gráfico ni DOM.
export class Reloj {
  constructor() {
    this.ahora = 0; // segundos de simulación
    this.cola = []; // montículo binario ordenado por (tiempo, orden de llegada)
    this.contador = 0;
    this.pausado = false;
    this.velocidad = 1;
    this.manejador = null; // función (evento, tiempo) que atiende los eventos que no son funciones
  }

  _menor(a, b) {
    return a.t < b.t || (a.t === b.t && a.n < b.n);
  }

  // Programa un evento para el instante absoluto t (en segundos de simulación).
  programar(t, evento) {
    const nodo = { t, n: this.contador++, evento };
    const c = this.cola;
    c.push(nodo);
    let i = c.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this._menor(c[i], c[p])) break;
      [c[i], c[p]] = [c[p], c[i]];
      i = p;
    }
    return nodo;
  }

  // Programa un evento dentro de dt segundos a partir de ahora.
  programarEn(dt, evento) {
    return this.programar(this.ahora + dt, evento);
  }

  proximo() {
    return this.cola.length ? this.cola[0].t : Infinity;
  }

  _sacar() {
    const c = this.cola;
    const top = c[0];
    const ultimo = c.pop();
    if (c.length) {
      c[0] = ultimo;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < c.length && this._menor(c[l], c[m])) m = l;
        if (r < c.length && this._menor(c[r], c[m])) m = r;
        if (m === i) break;
        [c[i], c[m]] = [c[m], c[i]];
        i = m;
      }
    }
    return top;
  }

  // Avanza dt segundos (ya multiplicados por la velocidad si el llamador lo desea)
  // y dispara en orden los eventos vencidos. No hace nada si está en pausa.
  avanzar(dt) {
    if (this.pausado || dt <= 0) return 0;
    const fin = this.ahora + dt;
    let disparados = 0;
    while (this.cola.length && this.cola[0].t <= fin) {
      const nodo = this._sacar();
      this.ahora = nodo.t;
      if (typeof nodo.evento === 'function') nodo.evento(this.ahora);
      else if (this.manejador) this.manejador(nodo.evento, this.ahora);
      disparados++;
    }
    this.ahora = fin;
    return disparados;
  }

  pausar() { this.pausado = true; }
  reanudar() { this.pausado = false; }
  alternarPausa() { this.pausado = !this.pausado; return this.pausado; }
  setVelocidad(v) { this.velocidad = v; }
}
