# Modelo formal: autómatas de KilnMaster

> Estado: **borrador**. Pendiente de verificar en JFLAP (Integrante B) y de validar con el docente los supuestos marcados con ⚠.

Notación: G = (Q, Σ, δ, q0, Qm); Σ = Σc ∪ Σuc y Σ = Σo ∪ Σuo.

## Autómata Vagón (×5, más el sexto si se agrega)
Q = {Crudo, Precalentado, Cocido, Enfriado, Quebrado}; q0 = Crudo; Qm = {Crudo} ⚠.

| Código | Evento | Controlable | Observable |
|---|---|---|---|
| P | precalentar | Sí | Sí |
| C | cocer | Sí | Sí |
| E | enfriar | Sí | Sí |
| D | descargar | Sí | Sí |
| L | limpiar_vagon | Sí | Sí |

Σuc = ∅ y Σuo = ∅ en el vagón (la ficha marca todos los eventos como controlables).

| Estado | P | C | E | D | L |
|---|---|---|---|---|---|
| Crudo | Precalentado | **Quebrado** | – | – | – |
| Precalentado | – | Cocido | **Quebrado** | – | – |
| Cocido | – | Cocido | Enfriado | – | – |
| Enfriado | – | – | – | Crudo ⚠ | – |
| Quebrado | – | – | – | – | Crudo |

Las transiciones en negrita son el choque térmico (fuera de secuencia). δ es parcial: un evento sin transición no está habilitado. ⚠ `descargar` lleva a Crudo, y Cocido admite `cocer` sin límite (el límite de 1 a 3 cocciones lo impone el lenguaje de reparación).

## Autómata de máquina simple (Molienda, Extrusora, Cortadora) ⚠
La ficha solo dice «autómata simple (Lista, Operando, Falla)». Q = {Lista, Operando, Falla}; q0 = Lista; Qm = {Lista}.

| Código | Evento | Controlable | Observable |
|---|---|---|---|
| I | iniciar | Sí | Sí |
| T | terminar | No | Sí |
| F | fallar | No | Sí |
| R | reparar | Sí | Sí |

| Estado | I | T | F | R |
|---|---|---|---|---|
| Lista | Operando | – | – | – |
| Operando | – | Lista | Falla | – |
| Falla | – | – | – | Lista |

## Lenguaje de reparación
Ficha: `^PC{1,3}E$`, con P = precalentar, C = ciclo de cocción, E = enfriar. En JFLAP: `P(C+CC+CCC)E`. L = {PCE, PCCE, PCCCE}.
Palabra válida de la ficha: `PCCE`. Inválidas: `PE`, `PCCCCE`.
DFA: q0 –P→ q1 –C→ q2 –C→ q3 –C→ q4; de q2, q3 y q4 sale E hacia q5 (final).

## Supervisor de secuencia
Estado prohibido: Quebrado.

| Estado del vagón | Evento deshabilitado | Razón formal |
|---|---|---|
| Crudo | C (cocer) | δ(Crudo, C) = Quebrado ∈ prohibidos |
| Precalentado | E (enfriar) | δ(Precalentado, E) = Quebrado ∈ prohibidos |

Como Σuc = ∅, el supervisor evita siempre Quebrado. En modo manual el jugador puede forzar esos eventos y pierde la carga de ladrillos.

## Palabras de prueba
Vagón (acepta si termina en Crudo): aceptan `PCED`, `PCCED`, `PCEDPCED`, `CL`; rechazan `PC`, `PCE`, `C`, `PE`.
Máquina simple: aceptan `ITIT`, `IFR`, `IFRIT`, la palabra vacía; rechazan `I`, `IF`, `IFRI`, `T`.
