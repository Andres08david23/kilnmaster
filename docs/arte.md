# Guía de estilo: KilnMaster 2.5D

Todo el arte se dibuja en código con Phaser 4 (sin archivos de imagen), en `src/arte/`. La hoja de arte es `hoja-arte.html`: se abre con `npm run dev` en la dirección `http://localhost:5173/hoja-arte.html`; las teclas 1 a 5 cambian de panel.

## 1. Pantalla y rejilla
- Juego de 960×540 px con escala FIT.
- Rejilla isométrica 2:1 con celdas de 64×32 px. Pantalla: `x = (celdaX − celdaY) · 32`, `y = (celdaX + celdaY) · 16 − z · 32`.
- Orden de profundidad por (x + y): el objeto más cercano tapa al lejano.
- Luz desde arriba a la izquierda: cara izquierda clara (×0,95), tapa más clara (×1,18) y cara derecha oscura (×0,78).

## 2. Paleta (14 colores)
| Uso | Nombre | Hex |
|---|---|---|
| Estado | operación | #2e9e5b |
| Estado | espera | #e0b21b |
| Estado | fallo | #d64545 |
| Estado | mantenimiento | #3b7dd8 |
| Térmico | precalentado | #f29b3d |
| Térmico | cocido | #ff5a1f |
| Escenario | suelo | #6b5b4d (la celda alterna es el mismo color ×1,1) |
| Escenario | muro | #8a4b3a |
| Escenario | riel | #3a3f47 |
| Escenario | metal | #7d8794 |
| Token | vagón (caja) | #b86b3c |
| Token | posición libre (rombo hueco) | #7fd6a0 |
| Token | vagón nuevo (caja con flecha) | #f2d16b |
| Token | cupo (rayo) | #6aa9ff |

Interfaz: fondo #1c1a1e, panel de HUD #231f26, texto #f1ece4, evento deshabilitado en #d64545.

## 3. Estados del autómata: color e ícono
**Vagón** (docs/modelo/automatas.md)
| Estado | Color | Ícono |
|---|---|---|
| Crudo | #e0b21b | ladrillo |
| Precalentado | #f29b3d | 1 llama |
| Cocido | #ff5a1f | 2 llamas |
| Enfriado | #3b7dd8 | copo |
| Quebrado | #d64545 | X |

**Máquinas simples** (Molienda, Extrusora, Cortadora)
| Estado | Color | Ícono |
|---|---|---|
| Lista | #e0b21b | pausa |
| Operando | #2e9e5b | engranaje |
| Falla | #d64545 | X |

La máquina muestra además una luz del color del estado y el ícono sobre ella.

## 4. Tokens (docs/modelo/petri.md)
| Lugar | Forma | Color |
|---|---|---|
| Vagon_X | caja con 2 ruedas | #b86b3c |
| Libre_X | rombo hueco | #7fd6a0 |
| Vagon_nuevo | caja con flecha | #f2d16b |
| Cupo | rayo | #6aa9ff |

Se dibujan a tamaño real (escala 1) y agrupados de 1, de 5 y de k unidades.

## 5. Horno túnel
Cada zona Z1 a Z4 tiene una temperatura de 0 a 1 y su boca se colorea con la rampa: gris (0) → ladrillo (0,25) → naranja rojizo (0,5) → naranja (0,75) → amarillo (1). En la fase de pulido se añade bloom y gradación de color.

## 6. HUD
- **HUD de máquina:** escena superpuesta con el grafo del autómata (clase `GrafoAutomata`): nodos circulares, flechas con el código del evento, flecha de entrada del estado inicial, doble círculo en los marcados, estado actual iluminado y eventos deshabilitados en rojo.
- **Radar del Árbol de Cobertura:** esquina superior derecha: verde, amarillo parpadeante o rojo.
- **HUD de partida:** reloj y turno arriba a la izquierda, puntaje arriba al centro, radar arriba a la derecha, tokens por lugar abajo a la izquierda y alertas abajo a la derecha.

## 7. Efectos de Phaser 4 (fase de pulido)
Glow en la máquina seleccionada y en el estado actual del HUD; bloom en eventos críticos (fallo, deadlock); partículas en el humo del horno; temblor de cámara al fallar; destello al ganar un logro.

## 8. Recursos creados
| Recurso | Archivo o función | Tamaño (px) | Estados o variantes |
|---|---|---|---|
| Vagón | `dibujarVagon` (maquinas.js) | ~70×40 | 5 (uno por estado) |
| Molienda | `dibujarMolienda` | ~60×70 | 3 |
| Extrusora | `dibujarExtrusora` | ~65×60 | 3 |
| Cortadora | `dibujarCortadora` | ~60×65 | 3 |
| Zona del horno | `dibujarZonaHorno` | ~64×60 | temperatura continua 0 a 1 |
| Tokens | `dibujarToken` (iconos.js) | ~18×12 | 4 tipos |
| Suelo, muros y riel | `dibujarSuelo`, `dibujarMuro`, `dibujarRiel` (planta.js) | 64×32 | 2 tonos de suelo |
| HUD de máquina | `GrafoAutomata` (hudAutomata.js) | 520×320 | según autómata |
| Radar | `dibujarRadar`, `Radar` (radar.js) | 64×64 | 3 colores |
