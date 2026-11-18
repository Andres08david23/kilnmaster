// Constantes del GDD (docs/GDD.md). Ningún otro archivo escribe estos números a mano.
export const ANCHO = 960;
export const ALTO = 540;
export const TILE_W = 64;
export const TILE_H = 32;
export const COLUMNAS = 8; // tamaño de la planta en celdas
export const FILAS = 8;
export const VELOCIDADES = [1, 2, 4]; // velocidades de simulación (teclas 1, 2 y 4)
export const SEMILLA = 20260101; // semilla del generador aleatorio: partidas reproducibles
export const DURACION_TURNO = 180; // segundos de simulación por turno (GDD, sección 7)
export const TURNOS = 3;
export const METAS = { 1: 400, 2: 700, 3: 1000 }; // meta de puntos por turno (GDD, sección 7)
