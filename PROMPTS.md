# PROMPTS.md: historial de prompts de KilnMaster (D.5)

**Herramienta:** Claude (Anthropic), en lugar de Antigravity. Se trabajó en una conversación continua, por commits, siguiendo los prompts de la guía (secciones 5.3 a 5.9) adaptados a KilnMaster.

**Nota:** las tablas resumen lo pedido; los 17 prompts de la guía (Anexo C) están copiados completos en las secciones de más abajo. La conversación se resumió en un punto por su longitud. La columna "Resultado" indica si el resultado sirvió al primer intento o si hubo que corregirlo, y qué se corrigió.

## Fase 1. Preproducción

| N.º | Commit | Qué se pidió (resumen) | Resultado | Corrección |
|---|---|---|---|---|
| 1 | Previos B y C | Autómatas en JFLAP (vagón, vagón supervisado, máquina simple, receta térmica) y red de Petri en PIPE2 (N1 sin prevención, N2 con prevención) | Funcionó con ajustes | Los archivos se generaron por código; cada integrante debe abrirlos y verificar en su programa |
| 2 | 01 | Tres habilidades del proyecto (diseñador, ingeniero de eventos discretos, director de arte). Prompts completos en la sección "Prompts de las habilidades" | Funcionó a la primera | Ninguna |
| 3 | 01 | Modelo formal en documentos (`automatas.md`, `petri.md`) y GDD | Funcionó con ajustes | Se dejaron marcadas con ⚠ las decisiones por validar con el docente (M0 de la red, destino de `descargar`, estado marcado) |
| 4 | 02 | Guía de estilo y hoja de arte: paleta, máquinas por estado, tokens, planta 8x8, HUD y radar | Funcionó con ajustes | La paleta salió con 15 colores y la guía pide 10 a 14: se quitó uno. Se reubicaron paneles que se superponían |

## Prompts de las habilidades (guía, Anexo C, prompts 2 a 4)

Los tres prompts se dieron de a uno, en orden. Las habilidades resultantes quedaron en `.agents/skills/` y su contenido sigue el texto de referencia de la guía.

**Prompt 2: habilidad "diseñador del simulador"** (`.agents/skills/disenador-simuladores-sed/`)
> Crea una habilidad (skill) llamada diseñador del simulador para mi proyecto. Debe decidir cómo se juega: qué hace el jugador, cómo gana puntos, cuándo pierde y qué logros hay, y escribir el documento de diseño con una lista para saber cuándo está terminado. Cada regla del juego debe salir de los autómatas y de la red de Petri. Guárdala en la carpeta de habilidades de este proyecto.

**Prompt 3: habilidad "ingeniero de eventos discretos"** (`.agents/skills/ingeniero-sed/`)
> Crea otra habilidad (skill) llamada ingeniero de eventos discretos. Debe cuidar que el juego obedezca exactamente los autómatas y la red de Petri que hicimos en JFLAP y PIPE2: ninguna máquina cambia de estado ni gasta recursos por fuera del modelo, y todo se comprueba con pruebas. Guárdala en la carpeta de habilidades de este proyecto.

**Prompt 4: habilidad "director de arte"** (`.agents/skills/director-arte-isometrico/`)
> Crea otra habilidad (skill) llamada director de arte para el mismo simulador. Debe decidir cómo se ve: la planta en vista isométrica, los colores de cada estado de las máquinas, la forma de cada tipo de token y la pantalla. Que todo sea original. Guárdala en la carpeta de habilidades de este proyecto.

**Resultado de los tres:** funcionaron a la primera. Después se aplicaron en el commit 01 (modelo formal y GDD) y en el 02 (guía de estilo y hoja de arte), cada una en su área.

## Prompts de preparación y documentos (guía, Anexo C, prompts 1, 5 y 6)

> **Prompt 1:** Crea una carpeta con el nombre de mi proyecto y prepárala para guardar versiones con git. Ya copié la carpeta modelos con los archivos de JFLAP y PIPE2. Todavía no escribas código: primero vamos a crear las habilidades del equipo.

> **Prompt 5:** Lee las tres habilidades que creamos, el diseñador, el ingeniero y el director de arte, y cuéntame en pocas palabras qué reglas vas a seguir. Crea una carpeta para los documentos y otra para imágenes de referencia. Si algo no está definido, pregúntame antes de inventarlo.

> **Prompt 6:** Usa al ingeniero para pasar a documentos los autómatas y la red de Petri que hicimos en JFLAP y PIPE2, sin cambiar nada. Después usa al diseñador y al director de arte para escribir el documento de diseño de mi simulador: qué máquinas hay, qué hace el jugador, cómo gana puntos, cómo se pierde por un bloqueo y qué se ve en pantalla. Pon una lista para saber cuándo está terminado.

**Resultado:** el prompt 1 se hizo en la carpeta del proyecto con `git init` y el primer commit. El 5 dio las reglas de trabajo. El 6 produjo `docs/modelo/automatas.md`, `docs/modelo/petri.md` y `docs/GDD.md`, con las decisiones por validar marcadas con ⚠.

## Prompts de construcción (guía, Anexo C, prompts 7 a 17)

Cada prompt corresponde a un paso de la guía. Se usó el texto de la guía y se adaptó a KilnMaster en los detalles (máquinas, eventos, nombres). Debajo de cada uno va el commit donde quedó el resultado y lo que hubo que corregir.

> **Prompt 7 (Paso 2, proyecto base en Phaser 4):** Prepara la página web del simulador con Phaser 4: la planta vista en diagonal, en estilo isométrico, con un reloj que avanza por eventos y que se puede pausar y acelerar. Separa el cerebro del simulador (los modelos) del dibujo, para poder probarlo aparte. Ábrela en el navegador y revisa que no haya errores.

Commits 03 y 04. Funcionó con ajustes: Phaser 4.2.1 no trae `addBloom`, se usó `addGlow`.

> **Prompt 8 (Paso 3, el cerebro del simulador):** Usa al ingeniero para convertir nuestros autómatas y nuestra red de Petri en código, sin dibujos todavía. Que cada máquina solo cambie de estado con la tabla de transiciones, que los recursos se muevan solo cuando una transición se dispara y que haya pruebas que den lo mismo que JFLAP y PIPE2.

Commit 05. Funcionó con ajustes: `motivoBloqueo` reportaba la capacidad antes del token que faltaba y una prueba de composición tenía mal el resultado esperado. Se corrigieron.

> **Prompt 9 (Paso 4, la planta en 2.5D):** Dibuja la planta como dice el documento de diseño, vista en diagonal: las máquinas, las tuberías o bandas y los depósitos. Cada máquina cambia de color según su estado y los recursos se ven como objetos que se mueven de un lugar a otro. Las fallas y llegadas ocurren solas según el reloj.

Commit 06. Funcionó con ajustes: se agregaron las posiciones del circuito y se separó `Simulacion` del dibujo.

> **Prompt 10 (Paso 5, ver el autómata de cada máquina):** Cuando haga clic en una máquina, abre una ventana con el dibujo de su autómata: círculos para los estados, flechas para los eventos y el estado actual iluminado. Pon botones para los eventos que puedo usar ahora y muéstrame en rojo los que están prohibidos y por qué.

Commit 07. Funcionó con ajustes: el grafo se superponía con los botones; se reescaló a 0,7. Después, el jugador vio que el texto del HUD tapaba el puntaje y el radar, y se corrigió en el pulido.

> **Prompt 11 (Paso 6, reparar con una expresión regular):** Cuando una máquina se dañe, que el jugador tenga que escribir la secuencia correcta de comandos para repararla. La secuencia se revisa con nuestra expresión regular: si está bien, la máquina vuelve a funcionar; si está mal, sigue dañada y pierde puntos.

Commit 08. Funcionó a la primera. La expresión es `P(C+CC+CCC)E`.

> **Prompt 12 (Paso 7, el vigilante o el detective):** Agrega lo que dice la ficha de mi proyecto: un vigilante que no deja hacer combinaciones peligrosas entre máquinas (el botón se pone rojo y explica por qué), o un detective que, cuando un sensor se daña y no se ve qué pasa, muestra en qué estados podría estar la máquina para que el jugador decida.

Commit 09. Para D.5 corresponde el vigilante (supervisor que impide llegar a Quebrado). Funcionó con ajustes: hizo fallar 10 pruebas de reparación y se agregó la opción `supervisor: false`.

> **Prompt 13 (Paso 8, los recursos como fichas):** Haz que los recursos de la red de Petri se vean como fichas en el mapa. Una estación solo trabaja cuando le llegan todas las fichas que necesita; si dos estaciones quieren la misma ficha, que se note; y si un depósito se llena de más, que se desborde y quite puntos.

Commit 10. Funcionó a la primera.

> **Prompt 14 (Paso 9, el radar de bloqueos):** Agrega una pantalla de pausa que muestre las matrices de la red de Petri y cómo cambia el marcado con cada disparo. Pon en una esquina un radar que mire unos pasos adelante: verde si todo va bien, amarillo si nos acercamos a un bloqueo y rojo si ya nadie puede moverse, y en ese caso termina la partida explicando qué pasó.

Commit 11. Funcionó con ajustes: las matrices se superponían con la ecuación y la fila resaltada quedaba una fila arriba. Se reubicaron.

> **Prompt 15 (Paso 10, pantalla, puntos, logros y celular):** Pon en pantalla lo que dice el documento de diseño: el reloj, los puntos, el radar, los recursos y las alertas. Agrega los 6 logros con un aviso animado, una pantalla de resultados al final del turno, botones para jugar en el celular y sonidos.

Commit 12. Funcionó con ajustes: los emoji de los botones no se veían y se cambiaron por texto.

> **Prompt 16 (Paso 11, pulido con Phaser 4 y pruebas):** Dale el toque final con los efectos de Phaser 4: brillo en la máquina elegida y en las alarmas, partículas en lo que fluye, la pantalla que tiembla cuando el vigilante bloquea algo y transiciones entre pantallas. Después juega varios turnos, arregla lo que no se sienta bien, vuelve a correr las pruebas y revisa la lista del documento de diseño.

Commits 13 y 14. Funcionó con ajustes: un filtro de brillo por zona bajaba los fps (se unificó en uno y se apaga solo bajo 40 fps); se corrigieron objetos duplicados al mover la cámara; en el playtest un bot hacía más de 200 lotes por turno y se agregó la duración de la cocción.

> **Prompt 17 (publicar en Netlify o Vercel):** Publica mi simulador en internet con Netlify o Vercel y dame un enlace para compartirlo con mis compañeros.

Lo ejecutó el integrante que tiene la cuenta, siguiendo los pasos que dio Claude (`npm run build` y subir la carpeta `dist`). El docente lo pidió como obligatorio. El enlace está en el README o en el informe.

## Fase 2. Producción

| N.º | Commit | Qué se pidió (resumen) | Resultado | Corrección |
|---|---|---|---|---|
| 5 | 03 | Proyecto base con Vite y Phaser 4 | Funcionó a la primera | Ninguna. Faltaba instalar Node |
| 6 | 04 | Base común: configuración, reloj por eventos con calendario, proyección isométrica, entrada, escenas | Funcionó con ajustes | Phaser 4.2.1 no trae `addBloom`: se usó `addGlow` |
| 7 | 05 | Núcleo formal sin Phaser: autómata, composición, observador, lenguaje, red de Petri, cobertura | Funcionó con ajustes | Se quitó la palabra "Phaser" de los comentarios de `src/sed/`. `motivoBloqueo` reportaba la capacidad antes del token que faltaba: se corrigió en dos pasadas. Una prueba de composición tenía mal el resultado esperado |
| 8 | 06 | Planta isométrica y entidades con vagones y máquinas | Funcionó con ajustes | Se agregaron las posiciones del circuito y se separó la lógica (`Simulacion`) del dibujo |
| 9 | 07 | HUD de máquina con grafo en vivo y botones por evento | Funcionó con ajustes | El grafo se superponía con los botones y la lista de eventos: se reescaló a 0,7 |
| 10 | 08 | Consola de reparación por expresión regular `P(C+CC+CCC)E` | Funcionó a la primera | Ninguna |
| 11 | 09 | Supervisor que impide llegar a Quebrado, modo manual y pestaña de composición | Funcionó con ajustes | El supervisor hizo fallar 10 pruebas de reparación: se agregó la opción `supervisor: false` |
| 12 | 10 | Tokens físicos y red de Petri en la planta, agregar vagón, deadlock | Funcionó a la primera | Ninguna |
| 13 | 11 | Inspector con Pre, Post, A y ecuación de estado, árbol de cobertura, radar, pantalla de deadlock | Funcionó con ajustes | Las matrices se superponían con la ecuación y la fila resaltada quedaba una fila arriba: se reubicaron y se recalculó la altura de línea |
| 14 | 12 | HUD de partida, turnos con metas, 6 logros, resultados, botones táctiles y sonido | Funcionó con ajustes | Los emoji de los botones no se veían: se cambiaron por texto |
| 15 | 13 | Pulido: brillo térmico, partículas, cámara con zoom y arrastre, transiciones | Funcionó con ajustes | Un filtro de brillo por zona bajaba mucho los fps: se unificó en uno solo y se apaga solo bajo 40 fps. Después del commit, el jugador detectó objetos duplicados al mover la cámara y el HUD tapando el puntaje y el radar: se corrigieron |
| 16 | 14 | Correcciones del playtest | Funcionó con ajustes | Un bot jugaba más de 200 lotes por turno: se agregó la duración de la cocción y que cada evento del vagón se ejecute en su zona |

## Fase 3. Entrega

| N.º | Qué se pidió (resumen) | Resultado | Corrección |
|---|---|---|---|
| 18 | README, PROMPTS.md, ZIP del simulador y guion del video | Funcionó a la primera | Ninguna |
| 19 | Las capturas de PIPE2 aparecían en el commit "Agregar evidencias de redes de Petri PIPE2" pero la carpeta `modelos/petri/capturas/` estaba vacía en el repositorio. Se pidió cómo recuperarlas | Funcionó a la primera | La causa fue un commit posterior que reemplazó la carpeta `modelos/petri/` y borró las 11 capturas. Se recuperaron con `git checkout 91b3b20 -- modelos/petri/capturas` y un nuevo commit. Los dos archivos `.pnml` tampoco estaban en el repositorio y se agregaron aparte. Lección: al aplicar archivos de un commit, agregar sin reemplazar carpetas completas |

## Qué decidió la herramienta que no estaba en el modelo ni en el GDD
- La duración de la cocción por turno (6, 7 y 8 s) y las zonas donde se ejecuta cada evento (P en Z1, C en Z2 o Z3, E en Z4, D en R1). Quedaron documentadas en `docs/playtest.md` y en el GDD.
- Las metas de puntos de cada turno (400, 700 y 1000) y los valores de los puntos. El bot de prueba muestra que se alcanzan con facilidad, y se dejó para revisión del docente.
- El observador (`observador.js`) está probado con un caso sintético, porque D.5 no lo usa en la partida.

## Lecciones
- Los prompts que daban un criterio comprobable ("ninguno de 10 000 eventos al azar llega a Quebrado") produjeron código con pruebas que lo verifican.
- Pedir primero la lógica sin dibujos y luego la capa visual evitó reescribir el modelo cuando cambió la interfaz.
- Revisar el repositorio ya publicado, y no solo los archivos locales, permitió encontrar evidencia borrada por error y recuperarla del historial de Git.
- Lo visual se revisó con capturas y el jugador corrigió detalles que las pruebas automáticas no detectan (superposiciones, objetos duplicados).
