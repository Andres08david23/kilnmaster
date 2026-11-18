# Modelo formal: red de Petri de KilnMaster

> Estado: **borrador**. Pendiente de verificar en PIPE2 (Integrante C) y de validar con el docente los supuestos marcados con ⚠.

Notación: N = (P, T, Pre, Post, M0). Pre y Post de tamaño |T| × |P| (fila por transición). A = Post − Pre. M_k = M_(k−1) + Aᵀ · u_k. PIPE2 muestra la incidencia con lugares en filas (|P| × |T|), que es la traspuesta de A.

## Red N1 (sin regla de prevención)
Circuito de 6 posiciones: Z1 → Z2 → Z3 → Z4 → R1 → R2 → Z1 (Z1 a Z4 en el horno, R1 y R2 en la vía de retorno). |P| = 13, |T| = 7.

### Lugares
| Lugar | M0 | k | Capacidad |
|---|---|---|---|
| Vagon_Z1 | 1 | 1 | estricta |
| Vagon_Z2 | 1 | 1 | estricta |
| Vagon_Z3 | 1 | 1 | estricta |
| Vagon_Z4 | 1 | 1 | estricta |
| Vagon_R1 | 1 | 1 | estricta |
| Vagon_R2 | 0 | 1 | estricta |
| Libre_Z1 | 0 | 1 | estricta |
| Libre_Z2 | 0 | 1 | estricta |
| Libre_Z3 | 0 | 1 | estricta |
| Libre_Z4 | 0 | 1 | estricta |
| Libre_R1 | 0 | 1 | estricta |
| Libre_R2 | 1 | 1 | estricta |
| Vagon_nuevo | 1 | 1 | estricta |

⚠ M0: la ficha da 5 vagones y habla del «sexto vagón», pero no fija la posición libre inicial. Se supone 5 vagones en el circuito, la posición libre en R2 y `Vagon_nuevo = 1` en el patio.

### Transiciones
| Transición | Efecto | Disparo |
|---|---|---|
| t_avanzar_Z1 | Vagon_Z1 + Libre_Z2 → Vagon_Z2 + Libre_Z1 | jugador ⚠ |
| t_avanzar_Z2 | Vagon_Z2 + Libre_Z3 → Vagon_Z3 + Libre_Z2 | jugador ⚠ |
| t_avanzar_Z3 | Vagon_Z3 + Libre_Z4 → Vagon_Z4 + Libre_Z3 | jugador ⚠ |
| t_avanzar_Z4 | Vagon_Z4 + Libre_R1 → Vagon_R1 + Libre_Z4 | jugador ⚠ |
| t_avanzar_R1 | Vagon_R1 + Libre_R2 → Vagon_R2 + Libre_R1 | jugador ⚠ |
| t_avanzar_R2 | Vagon_R2 + Libre_Z1 → Vagon_Z1 + Libre_R2 | jugador ⚠ |
| t_agregar_vagon | Vagon_nuevo + Libre_R1 → Vagon_R1 | jugador ⚠ |

⚠ El tipo de disparo (jugador o automático) no está en la ficha; es decisión del GDD.

### Matrices
**Pre**

| Transición | Vagon_Z1 | Vagon_Z2 | Vagon_Z3 | Vagon_Z4 | Vagon_R1 | Vagon_R2 | Libre_Z1 | Libre_Z2 | Libre_Z3 | Libre_Z4 | Libre_R1 | Libre_R2 | Vagon_nuevo |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| t_avanzar_Z1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| t_avanzar_Z2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| t_avanzar_Z3 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| t_avanzar_Z4 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| t_avanzar_R1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| t_avanzar_R2 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| t_agregar_vagon | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |

**Post**

| Transición | Vagon_Z1 | Vagon_Z2 | Vagon_Z3 | Vagon_Z4 | Vagon_R1 | Vagon_R2 | Libre_Z1 | Libre_Z2 | Libre_Z3 | Libre_Z4 | Libre_R1 | Libre_R2 | Vagon_nuevo |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| t_avanzar_Z1 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| t_avanzar_Z2 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| t_avanzar_Z3 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| t_avanzar_Z4 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| t_avanzar_R1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| t_avanzar_R2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| t_agregar_vagon | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

**A = Post − Pre**

| Transición | Vagon_Z1 | Vagon_Z2 | Vagon_Z3 | Vagon_Z4 | Vagon_R1 | Vagon_R2 | Libre_Z1 | Libre_Z2 | Libre_Z3 | Libre_Z4 | Libre_R1 | Libre_R2 | Vagon_nuevo |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| t_avanzar_Z1 | -1 | 1 | 0 | 0 | 0 | 0 | 1 | -1 | 0 | 0 | 0 | 0 | 0 |
| t_avanzar_Z2 | 0 | -1 | 1 | 0 | 0 | 0 | 0 | 1 | -1 | 0 | 0 | 0 | 0 |
| t_avanzar_Z3 | 0 | 0 | -1 | 1 | 0 | 0 | 0 | 0 | 1 | -1 | 0 | 0 | 0 |
| t_avanzar_Z4 | 0 | 0 | 0 | -1 | 1 | 0 | 0 | 0 | 0 | 1 | -1 | 0 | 0 |
| t_avanzar_R1 | 0 | 0 | 0 | 0 | -1 | 1 | 0 | 0 | 0 | 0 | 1 | -1 | 0 |
| t_avanzar_R2 | 1 | 0 | 0 | 0 | 0 | -1 | -1 | 0 | 0 | 0 | 0 | 1 | 0 |
| t_agregar_vagon | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | -1 | 0 | -1 |

### Propiedades esperadas
| Propiedad | Valor |
|---|---|
| Acotada | Sí, k = 1 en todos los lugares |
| Segura (1-acotada) | Sí |
| Marcados alcanzables distintos | 7 |
| Nodos del árbol de cobertura (contando el repetido al cerrar el ciclo) | 8 |
| Conflicto (choice) | Con Libre_R1 = 1, `t_avanzar_Z4` y `t_agregar_vagon` compiten por Libre_R1 |
| Deadlock | Sí, 1 marcado muerto |

Invariantes P:
- Vagon_X + Libre_X = 1 para X ∈ {Z1, Z2, Z3, Z4, R1, R2}.
- Vagon_Z1 + Vagon_Z2 + Vagon_Z3 + Vagon_Z4 + Vagon_R1 + Vagon_R2 + Vagon_nuevo = 6.

### Deadlock documentado
- Marcado muerto: Vagon_Z1 = Vagon_Z2 = Vagon_Z3 = Vagon_Z4 = Vagon_R1 = Vagon_R2 = 1; todos los Libre_X = 0; Vagon_nuevo = 0.
- Secuencia más corta desde M0: `t_avanzar_R1`, `t_agregar_vagon` (2 disparos).
- Causa: se agrega el sexto vagón y las 6 posiciones quedan ocupadas; ningún vagón puede avanzar.

## Red N2 (con regla de prevención)
N2 = N1 + lugar monitor `Cupo` (M0 = 0, k = 1), como lugar de entrada de `t_agregar_vagon` (peso 1). Regla: vagones en el circuito ≤ posiciones − 1 = 5. Invariante: Vagon_Z1 + … + Vagon_R2 + Cupo = 5.

| Propiedad de N2 | Valor |
|---|---|
| |P| / |T| | 14 / 7 |
| Marcados alcanzables | 6 |
| Nodos del árbol (con el repetido) | 7 |
| Deadlock | No hay |
| t_agregar_vagon | Nunca se dispara (Cupo = 0) |

## Verificación
Los resultados de esta página se calcularon con un programa propio. Falta comprobarlos en PIPE2 (ver `modelos/petri/`).
