// Efectos de sonido con Web Audio (sin archivos). El contexto se crea con el primer gesto del jugador,
// que es cuando el navegador lo permite.
export class Sonido {
  constructor() { this.ctx = null; this.silencio = false; }

  _ctx() {
    if (this.silencio) return null;
    if (!this.ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  // Un tono: frecuencia (Hz), duración (s), forma de onda, volumen y retardo.
  tono(f, dur = 0.12, tipo = 'square', vol = 0.06, retardo = 0) {
    const c = this._ctx();
    if (!c) return;
    const t0 = c.currentTime + retardo;
    const o = c.createOscillator(), g = c.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  alternar() { this.silencio = !this.silencio; return this.silencio; }

  clic() { this.tono(520, 0.06, 'square', 0.04); }
  avance() { this.tono(220, 0.12, 'triangle', 0.08); this.tono(330, 0.12, 'triangle', 0.06, 0.08); }
  bloqueado() { this.tono(140, 0.18, 'sawtooth', 0.07); this.tono(110, 0.2, 'sawtooth', 0.07, 0.12); }
  falla() { this.tono(300, 0.15, 'square', 0.06); this.tono(240, 0.2, 'square', 0.06, 0.15); }
  quebrado() { this.tono(180, 0.3, 'sawtooth', 0.08); this.tono(90, 0.35, 'sawtooth', 0.08, 0.2); }
  lote() { [523, 659, 784].forEach((f, i) => this.tono(f, 0.14, 'triangle', 0.07, i * 0.09)); }
  produccion() { this.tono(660, 0.07, 'sine', 0.04); }
  logro() { [659, 784, 988, 1319].forEach((f, i) => this.tono(f, 0.16, 'triangle', 0.07, i * 0.1)); }
  deadlock() { [196, 156, 123].forEach((f, i) => this.tono(f, 0.4, 'sawtooth', 0.08, i * 0.25)); }
  victoria() { [523, 659, 784, 1047].forEach((f, i) => this.tono(f, 0.2, 'triangle', 0.08, i * 0.12)); }
}
