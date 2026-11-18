# Playtest y correcciones (commit 14)

Prueba con un jugador automático (bot) que ejecuta los eventos de cada vagón y avanza el circuito, con la semilla fija 20260101.

| Hallazgo | Corrección |
|---|---|
| Sin duración de cocción, un vagón se descargaba al instante y el bot hacía más de 200 lotes en un turno | El ciclo de cocción C dura 6, 7 y 8 s (turnos 1, 2, 3): bloquea enfriar y cocer de nuevo hasta que termina |
| Los eventos se podían ejecutar en cualquier posición, así que el circuito no importaba | Cada evento se ejecuta solo en su zona (P en Z1, C en Z2 o Z3, E en Z4, D en R1); un lote exige una vuelta completa |
| Con un clic por segundo el bot llega a unos 27 lotes por turno (≈ 3 400 puntos) | ⚠ Las metas de 400, 700 y 1000 puntos se pueden alcanzar con facilidad; si el docente las considera bajas, se suben en `src/config.js` (METAS) |

Comprobación de los criterios de aceptación del GDD (sección 12):

| N.º | Resultado | Cómo se verificó |
|---|---|---|
| 3 | Cumple | Todo cambio de estado pasa por `Automata.ejecutar` (δ parcial); hay pruebas de eventos sin transición |
| 4 | Cumple | `test/lenguaje.test.js` y `test/reparacion.test.js`: PCE, PCCE y PCCCE se aceptan; PE y PCCCCE se rechazan |
| 5 | Cumple | `test/supervisor.test.js`: 10 000 eventos al azar y ningún vagón llega a Quebrado |
| 6 | Cumple | `test/petri_juego.test.js`: no se avanza si Libre_siguiente no tiene token |
| 7 | Cumple | Radar en verde con supervisor; amarillo en modo manual; rojo en el deadlock |
| 8 | Cumple | `probarDisparo` y `test/petri.test.js` verifican M_k = M_(k−1) + Aᵀ·u_k |
| 1, 2, 9, 10 | Se comprueban jugando | Revisar con la lista de la sección 12 |
