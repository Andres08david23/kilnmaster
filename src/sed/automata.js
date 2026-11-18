// Autómata de estado finito G = (Q, Σ, δ, q0, Qm). Una instancia por máquina.
// El estado solo cambia con ejecutar(σ), que consulta ÚNICAMENTE la tabla δ.
export class Automata {
  constructor(modelo) {
    this.modelo = modelo;
    this.nombre = modelo.nombre;
    this.delta = new Map(); // "estado|evento" -> estado siguiente
    for (const [de, ev, a] of modelo.transiciones) this.delta.set(`${de}|${ev}`, a);
    this.estado = modelo.inicial;
    this.historial = [];
  }

  // Γ(q): eventos con transición definida desde el estado actual.
  eventosActivos(q = this.estado) {
    return this.modelo.eventos.map((e) => e.id).filter((id) => this.delta.has(`${q}|${id}`));
  }

  puede(evento, q = this.estado) {
    return this.delta.has(`${q}|${evento}`);
  }

  siguiente(evento, q = this.estado) {
    return this.delta.get(`${q}|${evento}`);
  }

  // Ejecuta σ. Lanza un error si δ(q, σ) no está definida.
  ejecutar(evento) {
    const a = this.delta.get(`${this.estado}|${evento}`);
    if (a === undefined) throw new Error(`δ(${this.estado}, ${evento}) no está definida`);
    this.historial.push({ evento, de: this.estado, a });
    this.estado = a;
    return a;
  }

  esMarcado(q = this.estado) {
    return this.modelo.marcados.includes(q);
  }

  esControlable(evento) {
    const e = this.modelo.eventos.find((v) => v.id === evento);
    return !!e && e.controlable;
  }

  codigo(evento) {
    const e = this.modelo.eventos.find((v) => v.id === evento);
    return e ? e.codigo : evento;
  }

  // Palabra observada: los códigos de los eventos ejecutados.
  palabra() {
    return this.historial.map((h) => this.codigo(h.evento)).join('');
  }

  reiniciar() {
    this.estado = this.modelo.inicial;
    this.historial = [];
  }

  // ¿La palabra (cadena de códigos de una letra) es aceptada? Termina en un estado marcado y todo evento tiene δ.
  acepta(palabra) {
    let q = this.modelo.inicial;
    for (const c of palabra) {
      const ev = this.modelo.eventos.find((e) => e.codigo === c);
      if (!ev) return false;
      const a = this.delta.get(`${q}|${ev.id}`);
      if (a === undefined) return false;
      q = a;
    }
    return this.modelo.marcados.includes(q);
  }
}
