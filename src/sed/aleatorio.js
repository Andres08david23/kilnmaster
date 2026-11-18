// Generador aleatorio con semilla (mulberry32). Misma semilla, misma secuencia: partidas reproducibles.
// Núcleo formal: sin motor gráfico ni DOM.
export class Aleatorio {
  constructor(semilla = 1) {
    this.estado = semilla >>> 0;
  }

  // número en [0, 1)
  siguiente() {
    this.estado = (this.estado + 0x6d2b79f5) >>> 0;
    let t = this.estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // entero en [min, max]
  entero(min, max) {
    return min + Math.floor(this.siguiente() * (max - min + 1));
  }

  // tiempo con distribución exponencial de media dada (para el tiempo entre fallas)
  exponencial(media) {
    return -Math.log(1 - this.siguiente()) * media;
  }

  // elemento al azar de una lista
  elegir(lista) {
    return lista[this.entero(0, lista.length - 1)];
  }
}
