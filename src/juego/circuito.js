// Circuito de 6 posiciones del horno túnel y su ubicación en la rejilla (docs/modelo/petri.md).
// Z1 a Z4 están en el horno y R1, R2 en la vía de retorno. El orden es el del ciclo Z1 → Z2 → Z3 → Z4 → R1 → R2 → Z1.
export const POSICIONES = ['Z1', 'Z2', 'Z3', 'Z4', 'R1', 'R2'];
export const siguiente = (p) => POSICIONES[(POSICIONES.indexOf(p) + 1) % POSICIONES.length];

// Celda (x, y) de cada posición en la planta de 8x8.
export const CELDA = { Z1: [2, 3], Z2: [3, 3], Z3: [4, 3], Z4: [5, 3], R1: [5, 5], R2: [2, 5] };
export const CELDA_PATIO = [7, 5]; // el patio donde espera Vagon_nuevo

// Celdas de riel de la vía (incluye los tramos entre posiciones) con su eje.
export const RIELES = [
  [2, 3, 'x'], [3, 3, 'x'], [4, 3, 'x'], [5, 3, 'x'],
  [5, 4, 'y'], [5, 5, 'x'],
  [4, 5, 'x'], [3, 5, 'x'], [2, 5, 'x'],
  [2, 4, 'y'],
];
export const CELDAS_MAQUINA = { molienda: [1, 1], extrusora: [3, 1], cortadora: [5, 1] };
// Temperatura inicial de cada zona del horno (0 a 1).
export const TEMPERATURA_ZONA = { Z1: 0.3, Z2: 0.6, Z3: 0.85, Z4: 0.55 };
