# KilnMaster (D.5): simulador de un horno túnel de ladrillera

Simulador isométrico 2.5D hecho con **Phaser 4.2.1**, **Vite** y JavaScript. El juego se rige por **autómatas finitos** (Unidad 2) y **redes de Petri** (Unidad 3): cada vagón y cada máquina tiene su autómata, el supervisor impide que un vagón llegue a *Quebrado*, y el circuito del horno es una red de Petri con tokens, conflicto, deadlock y prevención.

Laboratorio 1 de Modelado y Simulación de Sistemas de Eventos Discretos, Universidad de Pamplona.

## Enlaces
- Simulador en línea: https://polite-granita-ef1d69.netlify.app/
- Repositorio: https://github.com/Andres08david23/kilnmaster
- Video: https://youtu.be/LLP7K283zUc
- Integrantes (grupo BR): Andres Garcia, Sebastian Perez, Anderson Coronado

## Requisitos
- Node.js 22 LTS (22.12 o superior) o 24
- Git
- Chrome o Edge 115 o superior (necesita WebGL)

## Ejecutar el juego
```
npm install
npm run dev
```
Abre la dirección que muestra (normalmente http://localhost:5173).

## Pruebas
```
npm test
```
Corre las pruebas del núcleo formal y de la lógica del juego con el ejecutor de pruebas de Node. Deben pasar todas (99).

## Construir la versión final
```
npm run build
```
Genera la carpeta `dist/` (un `index.html` y `assets/`). Su contenido se comprime en un ZIP con `index.html` en la raíz para entregarlo, o se publica en Netlify o Vercel (comando `npm run build`, carpeta `dist`). Phaser se carga desde un CDN, así que el juego necesita conexión a internet.

## Cómo se juega
- **Clic en un vagón o una máquina:** abre su HUD con el autómata en vivo. Los botones verdes son eventos controlables y habilitados, los grises no son controlables o están fuera de su zona, y los rojos los deshabilita el supervisor.
- **Reparación:** un vagón *Quebrado* se repara escribiendo en la consola una palabra del lenguaje `P(C+CC+CCC)E`.
- **Circuito:** el botón *Avanzar* de cada vagón dispara una transición de la red de Petri. Un clic en el vagón del patio intenta agregar un sexto vagón.
- **Meta:** 400, 700 y 1000 puntos en 3 turnos de 180 s.

| Tecla | Acción |
|---|---|
| `P` | Pausa |
| `I` | Inspector de la red de Petri (matrices, ecuación de estado, árbol de cobertura) |
| `1`, `2`, `4` | Velocidad de la simulación |
| `M` | Supervisor activo o modo manual (permite provocar un deadlock) |
| `Esc` | Cierra el panel abierto |
| Rueda del mouse / arrastrar | Zoom y movimiento de la cámara |

## Estructura
| Carpeta | Contenido |
|---|---|
| `src/sed/` | Núcleo formal sin Phaser ni DOM: autómatas, composición, supervisor, observador, lenguaje, red de Petri y árbol de cobertura, con sus modelos JSON en `src/sed/modelos/` |
| `src/juego/` | Lógica del juego (`Simulacion`), el circuito y la disposición de los grafos |
| `src/escenas/`, `src/entidades/`, `src/arte/`, `src/iso/`, `src/entrada/`, `src/audio/` | Capa visual con Phaser: solo lee la simulación y le envía solicitudes |
| `test/` | Pruebas del núcleo formal y de la simulación |
| `modelos/` | Autómatas de JFLAP (`.jff`) y redes de Petri de PIPE2 (`.pnml`), con sus capturas |
| `docs/` | GDD, guía de arte, modelo formal (`modelo/automatas.md`, `modelo/petri.md`) y notas de playtest |
| `.agents/skills/` | Las tres habilidades del proyecto |
| `hoja-arte.html` | Hoja de arte (paleta, máquinas, tokens, planta y HUD) |

## Documentación
- `docs/GDD.md`: diseño del juego
- `docs/modelo/automatas.md` y `docs/modelo/petri.md`: modelo formal
- `docs/arte.md`: guía de estilo
- `docs/playtest.md`: correcciones del playtest
