// Red de Petri N = (P, T, Pre, Post, M0) con capacidad k por lugar.
// Pre y Post de tamaño |T| x |P| (fila por transición). A = Post − Pre. M' = M + Aᵀ · u (u: vector de disparo).
// Ningún recurso cambia sino por disparar(t).
export class RedPetri {
  constructor(modelo) {
    this.modelo = modelo;
    this.lugares = modelo.lugares;
    this.transiciones = modelo.transiciones;
    this.pre = modelo.pre;
    this.post = modelo.post;
    this.A = this.post.map((fila, t) => fila.map((v, p) => v - this.pre[t][p])); // |T| x |P|
    this.k = this.lugares.map((l) => l.k);
    this.estricta = this.lugares.map((l) => l.capacidad === 'estricta');
    this.M0 = this.lugares.map((l) => l.m0);
    this.M = [...this.M0];
    this.historial = [];
  }

  // t puede ser el índice, el id ("t1") o el nombre ("t_avanzar_Z1").
  indiceT(t) {
    if (typeof t === 'number') return t;
    const i = this.transiciones.findIndex((x) => x.id === t || x.nombre === t);
    if (i < 0) throw new Error(`transición desconocida: ${t}`);
    return i;
  }

  indiceP(p) {
    const i = this.lugares.findIndex((x) => x.id === p || x.nombre === p);
    if (i < 0) throw new Error(`lugar desconocido: ${p}`);
    return i;
  }

  // ¿t habilitada en el marcado M? M >= Pre(t) y, en lugares de capacidad estricta, M + A(t) <= k.
  // Los lugares con ω (Infinity) siempre cumplen.
  habilitadaEn(M, t) {
    const i = this.indiceT(t);
    for (let p = 0; p < M.length; p++) {
      if (M[p] < this.pre[i][p]) return false;
      if (this.estricta[p] && M[p] !== Infinity && M[p] + this.A[i][p] > this.k[p]) return false;
    }
    return true;
  }

  habilitada(t) {
    return this.habilitadaEn(this.M, t);
  }

  habilitadasEn(M) {
    return this.transiciones.map((_, i) => i).filter((i) => this.habilitadaEn(M, i));
  }

  habilitadas() {
    return this.habilitadasEn(this.M);
  }

  // Lugar que impide el disparo (para mostrar qué token falta): { lugar, falta } o null.
  motivoBloqueo(t) {
    const i = this.indiceT(t);
    // primero los tokens de entrada que faltan (AND-join) y después la capacidad estricta
    for (let p = 0; p < this.M.length; p++) {
      if (this.M[p] < this.pre[i][p]) return { lugar: this.lugares[p].nombre, tipo: 'falta_token', falta: this.pre[i][p] - this.M[p] };
    }
    for (let p = 0; p < this.M.length; p++) {
      if (this.estricta[p] && this.M[p] + this.A[i][p] > this.k[p]) return { lugar: this.lugares[p].nombre, tipo: 'capacidad' };
    }
    return null;
  }

  // Marcado que resultaría de disparar t en M: M + Aᵀ · u con u one-hot (sin aplicarlo).
  siguienteMarcado(M, t) {
    const i = this.indiceT(t);
    const u = this.transiciones.map((_, j) => (j === i ? 1 : 0));
    return M.map((m, p) => m + u.reduce((s, uj, j) => s + this.A[j][p] * uj, 0));
  }

  disparar(t) {
    const i = this.indiceT(t);
    if (!this.habilitada(i)) {
      const m = this.motivoBloqueo(i);
      throw new Error(`${this.transiciones[i].nombre} no está habilitada${m ? ` (${m.lugar})` : ''}`);
    }
    const antes = this.M;
    this.M = this.siguienteMarcado(this.M, i);
    this.historial.push({ transicion: this.transiciones[i].nombre, antes, despues: this.M });
    return this.M;
  }

  // Conflictos (choice): pares de transiciones habilitadas que comparten un lugar de entrada.
  conflictos() {
    const hab = this.habilitadas();
    const res = [];
    for (let a = 0; a < hab.length; a++) {
      for (let b = a + 1; b < hab.length; b++) {
        const comp = this.lugares.filter((_, p) => this.pre[hab[a]][p] > 0 && this.pre[hab[b]][p] > 0).map((l) => l.nombre);
        if (comp.length) res.push({ t1: this.transiciones[hab[a]].nombre, t2: this.transiciones[hab[b]].nombre, lugares: comp });
      }
    }
    return res;
  }

  esMuertoEn(M) {
    return this.habilitadasEn(M).length === 0;
  }

  esMuerto() {
    return this.esMuertoEn(this.M);
  }

  marcado() {
    const o = {};
    this.lugares.forEach((l, p) => { o[l.nombre] = this.M[p]; });
    return o;
  }

  reiniciar(M = this.M0) {
    this.M = [...M];
    this.historial = [];
  }
}
