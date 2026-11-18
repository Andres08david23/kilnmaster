// Paleta del simulador KilnMaster (docs/arte.md). Colores como número 0xRRGGBB.
export const PALETA = {
  // estado (obligatorios de la guía)
  operacion: 0x2e9e5b,
  espera: 0xe0b21b,
  fallo: 0xd64545,
  mantenimiento: 0x3b7dd8,
  // térmicos del vagón
  precalentado: 0xf29b3d,
  cocido: 0xff5a1f,
  // escenario
  suelo: 0x6b5b4d,
  muro: 0x8a4b3a,
  riel: 0x3a3f47,
  metal: 0x7d8794,
  fondo: 0x1c1a1e,
  // tokens
  tokenVagon: 0xb86b3c,
  tokenLibre: 0x7fd6a0,
  tokenNuevo: 0xf2d16b,
  tokenCupo: 0x6aa9ff,
  // interfaz
  texto: 0xf1ece4,
  hud: 0x231f26,
  deshabilitado: 0xd64545,
};

// Color de cada estado de cada autómata (nombres tal como en la ficha).
export const COLOR_ESTADO = {
  Vagon: {
    Crudo: PALETA.espera,
    Precalentado: PALETA.precalentado,
    Cocido: PALETA.cocido,
    Enfriado: PALETA.mantenimiento,
    Quebrado: PALETA.fallo,
  },
  Maquina: {
    Lista: PALETA.espera,
    Operando: PALETA.operacion,
    Falla: PALETA.fallo,
  },
};

// Ícono que se dibuja sobre cada máquina según su estado.
export const ICONO_ESTADO = {
  Vagon: { Crudo: 'ladrillo', Precalentado: 'llama1', Cocido: 'llama2', Enfriado: 'copo', Quebrado: 'x' },
  Maquina: { Lista: 'pausa', Operando: 'engranaje', Falla: 'x' },
};

export const hex = (n) => '#' + n.toString(16).padStart(6, '0');

// Oscurece (f < 1) o aclara (f > 1) un color.
export function sombra(color, f) {
  const r = Math.min(255, Math.round(((color >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((color >> 8) & 255) * f));
  const b = Math.min(255, Math.round((color & 255) * f));
  return (r << 16) | (g << 8) | b;
}

// Color de una zona del horno según su temperatura (0 = frío, 1 = incandescente).
export function colorTermico(t) {
  const rampa = [0x4a4f58, 0x8a4b3a, 0xc2562a, 0xff7a1a, 0xffc04a];
  const x = Math.max(0, Math.min(1, t)) * (rampa.length - 1);
  const i = Math.min(rampa.length - 2, Math.floor(x));
  const f = x - i;
  const a = rampa[i], b = rampa[i + 1];
  const mix = (s) => Math.round(((a >> s) & 255) * (1 - f) + ((b >> s) & 255) * f);
  return (mix(16) << 16) | (mix(8) << 8) | mix(0);
}
