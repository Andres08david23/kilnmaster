// Validador del lenguaje de reparación: RegExp anclada (^...$) Y DFA exportado de JFLAP.
export class Lenguaje {
  // dfa: modelo JSON del DFA (estados, inicial, marcados, eventos con codigo, transiciones).
  constructor(dfa) {
    this.dfa = dfa;
    this.regex = new RegExp(dfa.expresion);
    this.delta = new Map();
    for (const [de, ev, a] of dfa.transiciones) {
      const e = dfa.eventos.find((v) => v.id === ev);
      this.delta.set(`${de}|${e.codigo}`, a);
    }
    this.alfabeto = dfa.eventos.map((e) => e.codigo);
    this.reiniciar();
  }

  reiniciar() {
    this.estado = this.dfa.inicial;
    this.palabra = '';
    this.muerto = false;
  }

  // Valida la palabra completa con la RegExp y con el DFA. Las dos deben coincidir.
  evaluar(palabra) {
    const porRegex = this.regex.test(palabra);
    let q = this.dfa.inicial;
    let ok = true;
    for (const c of palabra) {
      const a = this.delta.get(`${q}|${c}`);
      if (a === undefined) { ok = false; break; }
      q = a;
    }
    const porDfa = ok && this.dfa.marcados.includes(q);
    return { regex: porRegex, dfa: porDfa, pertenece: porRegex && porDfa };
  }

  pertenece(palabra) {
    return this.evaluar(palabra).pertenece;
  }

  // Avanza un símbolo para mostrar el progreso paso a paso en la consola.
  // Devuelve { estado, valido, esperados }. Si no hay transición, valido = false y esperados lista los símbolos posibles.
  avanzar(simbolo) {
    const esperados = this.simbolosEsperados();
    const a = this.delta.get(`${this.estado}|${simbolo}`);
    if (this.muerto || a === undefined) {
      this.muerto = true;
      this.palabra += simbolo;
      return { estado: null, valido: false, esperados };
    }
    this.estado = a;
    this.palabra += simbolo;
    return { estado: a, valido: true, esperados: this.simbolosEsperados(), marcado: this.dfa.marcados.includes(a) };
  }

  simbolosEsperados() {
    if (this.muerto) return [];
    return this.alfabeto.filter((c) => this.delta.has(`${this.estado}|${c}`));
  }
}
