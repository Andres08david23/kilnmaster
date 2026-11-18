# GDD: KilnMaster 2.5D (proyecto D.5, horno túnel y planta ladrillera)

> Estado: **borrador**. Los valores marcados con ⚠ son decisiones del GDD, no del modelo: el equipo las acepta o las rechaza de forma explícita. Todo lo demás sale de `docs/modelo/`.

## 1. Concepto
El jugador opera una planta ladrillera vista en isométrico 2.5D: molienda, extrusora y cortadora preparan el material y un horno túnel de 4 zonas cuece los ladrillos sobre vagones que circulan por un circuito de 6 posiciones. El jugador decide cuándo avanzar cada vagón y qué evento ejecutar sobre él. Un evento fuera de secuencia quiebra el vagón; agregar un vagón de más bloquea todo el circuito.

## 2. Pilares
1. **El modelo manda.** Ninguna máquina cambia de estado sino por δ; ningún vagón se mueve sino por el disparo de una transición.
2. **Ver la teoría.** El autómata de cada máquina y la red del circuito están siempre accesibles (HUD, inspector, radar).
3. **El bloqueo se puede evitar.** El deadlock es consecuencia de una decisión del jugador, no del azar.

## 3. MDA
| Nivel | Contenido |
|---|---|
| Mecánicas | Un vagón avanza solo si la posición siguiente está libre (AND-join de Vagon_X y Libre_siguiente). Cocer desde Crudo o enfriar desde Precalentado quiebra el vagón (δ). El supervisor deshabilita esos eventos. Agregar un vagón sin cupo bloquea el circuito. |
| Dinámicas | El jugador reparte su atención entre vagones y máquinas; con el supervisor apagado puede arriesgar para ganar tiempo; la tentación de agregar el sexto vagón lo lleva al bloqueo. |
| Estéticas | Tensión del radar que pasa de verde a amarillo parpadeante; brillo térmico del horno; alivio al reparar con la receta correcta. |

## 4. Ciclo de juego
| Ciclo | Duración ⚠ | Qué hace el jugador |
|---|---|---|
| Corto: atender una máquina o un vagón | 5 a 20 s de simulación | Elegir un vagón o máquina, ver su autómata y ejecutar un evento habilitado. |
| Medio: completar un lote | 25 a 40 s de simulación | Llevar un vagón por precalentar, cocer, enfriar y descargar (P, C, E, D). |
| Largo: terminar un turno | 180 s de simulación | Cumplir la meta de puntos del turno sin deadlock. |

## 5. Victoria y derrota
- **Victoria:** completar los 3 turnos (540 s de simulación en total) alcanzando la meta de puntos de cada uno.
- **Derrota por meta:** terminar un turno con menos puntos que la meta. Se puede reintentar el turno.
- **Derrota por deadlock (game over):** el marcado alcanzado no habilita ninguna transición (`esMuerto()`). Se detiene la simulación y se muestra el marcado muerto, la secuencia de disparos y la regla de prevención.

## 6. Reglas, puntaje y su elemento formal
| Mecánica | Regla | Puntos | Elemento formal |
|---|---|---|---|
| Lote completado | Descargar un vagón en Enfriado | +100 puntos | Evento D; δ(Enfriado, D) = Crudo |
| Máquina produce | Una máquina completa su operación | +10 puntos | Evento T de Molienda, Extrusora y Cortadora |
| Máquina falla | Ocurre F mientras opera (no controlable) y hay que reparar con R | 0 puntos; la máquina queda parada | Evento F (Σuc); estado Falla |
| Vagón quebrado | Cocer desde Crudo o enfriar desde Precalentado en modo manual | −50 puntos y se pierde la carga | δ(Crudo, C) y δ(Precalentado, E) = Quebrado |
| Reparar vagón | Escribir una palabra de L en la consola | +30 puntos | Lenguaje P(C+CC+CCC)E; evento L y luego P, C, E |
| Palabra inválida | La palabra no está en L | −10 puntos | w ∉ L |
| Pedir ayuda | Mostrar la expresión regular | −20 puntos | `^PC{1,3}E$` |
| Intento bloqueado | Forzar un evento deshabilitado con el supervisor activo | −5 puntos, se registra | Estados prohibidos del supervisor |
| Avanzar vagón | Mover un vagón a la posición libre siguiente | 0 puntos | Transición t_avanzar_X (Pre: Vagon_X, Libre_siguiente) |
| Agregar vagón | Meter el vagón del patio en R1 | 0 puntos | t_agregar_vagon; regla de prevención con el lugar Cupo |
| Deadlock | Circuito lleno | game over | Marcado muerto de N1 |

- **Supervisor activo (por defecto):** los eventos que llevan a Quebrado salen en rojo con la razón formal, y `t_agregar_vagon` sale en rojo con la razón «Cupo = 0: vagones ≤ posiciones − 1». Equivale a la red N2.
- **Modo manual** ⚠: el jugador desactiva el supervisor y puede forzar esos eventos. Equivale a la red N1.
- ⚠ **Inicio automático de las máquinas:** Molienda, Extrusora y Cortadora repiten su ciclo solas (el evento `iniciar` se ejecuta 1 s después de `terminar` o de `reparar`). Las fallas `fallar` ocurren por azar con semilla y la máquina espera a que el jugador ejecute `reparar`.
- Cada vagón es una instancia del autómata Vagón. Los tokens de la red no tienen identidad: el vagón sigue a su token al avanzar, porque el circuito no permite adelantar. El vagón agregado nace en Crudo.
- ⚠ Los eventos del vagón se ejecutan por clic del jugador y **solo en su zona** (corrección del playtest): P en Z1, C en Z2 o Z3, E en Z4 y D en R1. Así un lote exige una vuelta completa del circuito. Fuera de la zona el botón sale gris con la razón. La reparación (L) se hace desde la consola en cualquier posición.
- Un ciclo de cocción C dura 6, 7 u 8 s según el turno: durante ese tiempo el vagón no se puede enfriar ni cocer otra vez.

## 7. Tiempos y turnos (segundos de simulación ⚠)
| Concepto | Turno 1 | Turno 2 | Turno 3 |
|---|---|---|---|
| Duración | 180 s | 180 s | 180 s |
| Meta de puntos | 400 puntos | 700 puntos | 1000 puntos |
| Operación de Molienda, Extrusora y Cortadora (de I a T) | 6 s, 8 s y 5 s | 6 s, 8 s y 5 s | 6 s, 8 s y 5 s |
| Tiempo medio entre fallas F (por máquina) | 60 s | 45 s | 30 s |
| Un ciclo de cocción C | 6 s | 7 s | 8 s |

Los eventos no controlables (F) se programan en el reloj con una semilla fija, así que cada partida es reproducible. La dificultad crece porque las fallas son más seguidas y la cocción más lenta.

## 8. Controles
| Acción | Mouse y teclado | Táctil |
|---|---|---|
| Seleccionar máquina o vagón y abrir su HUD | Clic | Tocar |
| Disparar evento o transición | Clic en el botón | Tocar el botón |
| Escribir en la consola de reparación | Teclado | Botones con los comandos P, C, E |
| Pausa | P | Botón en pantalla |
| Inspector de la red | I | Botón en pantalla |
| Velocidad de simulación | 1, 2, 4 | Botón de velocidad |
| Cerrar | Esc | Botón cerrar |
| Mover y acercar la cámara | Arrastre y rueda | Arrastre y pellizco |
| Activar o desactivar el supervisor ⚠ | M | Botón en pantalla |

## 9. HUD por zonas
| Zona | Contenido |
|---|---|
| Arriba izquierda | Reloj de simulación (s) y número de turno |
| Arriba centro | Puntaje |
| Arriba derecha | Radar del Árbol de Cobertura |
| Abajo izquierda | Tokens por lugar (Vagon_X y Libre_X con m/k, Vagon_nuevo) |
| Abajo derecha | Alertas: fallas, vagones quebrados, intentos bloqueados |

**Radar** (exploración a 3 disparos con la regla de habilitación vigente):
- Verde: no hay marcados muertos alcanzables en 3 disparos.
- Amarillo parpadeante: hay uno. Con el supervisor apagado y el sexto vagón en el patio, ocurre cuando la posición libre está en R1, R2 o Z1.
- Rojo: el marcado actual está muerto.
Con el supervisor activo, `t_agregar_vagon` está deshabilitada y el radar queda en verde.

## 10. Logros (condición verificable)
| N.º | Logro | Condición |
|---|---|---|
| 1 | Primer lote | El evento D se ejecuta una vez sobre un vagón en Enfriado |
| 2 | Cero quebrados | Un turno completo sin que ningún vagón entre a Quebrado |
| 3 | Receta perfecta | Una palabra de L repara un vagón en el primer intento |
| 4 | Esquivé el bloqueo | El radar pasa de amarillo a verde en modo manual sin llegar a rojo |
| 5 | Supervisor probado | Se registra un intento bloqueado por el supervisor |
| 6 | Turno final | Completar el turno 3 con la meta de puntos |

## 11. Balance
- El deadlock se provoca con una mala decisión: en modo manual, con la posición libre en R1, agregar el vagón (secuencia mínima desde M0: `t_avanzar_R1` y `t_agregar_vagon`).
- Se evita con una buena decisión: no agregar el vagón, o dejar el supervisor activo.
- Ninguna estrategia gana siempre: apagar el supervisor ahorra tiempo en las zonas pero expone a Quebrado y al bloqueo.

## 12. Criterios de aceptación (se comprueban jugando)
| N.º | Criterio | Cómo se comprueba |
|---|---|---|
| 1 | El color e ícono de cada máquina coinciden con su estado | Abrir el HUD de 3 máquinas en momentos distintos |
| 2 | El grafo del HUD es igual al de JFLAP | Comparar con el `.jff` |
| 3 | Ninguna máquina cambia de estado sin un evento de δ | Revisar el historial de eventos del HUD |
| 4 | La consola repara con PCE, PCCE y PCCCE y rechaza PE y PCCCCE | Probar 3 válidas y 3 inválidas |
| 5 | El supervisor nunca deja llegar a Quebrado | Intentar 3 veces cocer desde Crudo |
| 6 | Ningún vagón avanza si la posición siguiente está ocupada | Intentar avanzar con la siguiente ocupada |
| 7 | El radar pasa por verde, amarillo y rojo | Modo manual: agregar el vagón con la posición libre en R1 |
| 8 | El inspector calcula bien M_k = M_(k−1) + Aᵀ · u_k | Verificar 3 disparos a mano |
| 9 | HUD completo en las zonas indicadas y 6 logros con aviso | Comparar con la sección 9 |
| 10 | Controles táctiles equivalentes | Jugar un turno en celular o tableta |

## 13. Alcance mínimo y capacidad de Phaser 4
Horno de 4 zonas, 5 vagones en circuito de 6 posiciones, molienda, extrusora y cortadora. Capacidad: bloom y glow térmico por zona con gradación de color (el color de cada zona cambia de frío a incandescente con la temperatura). La dirección de arte va en `docs/arte.md`.
