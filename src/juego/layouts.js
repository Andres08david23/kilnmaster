// Distribución de los nodos de cada autómata en el HUD. Parte de las posiciones del archivo .jff de JFLAP
// (modelos/automatas/*.jff), centradas y escaladas por 0,7, para que el grafo del HUD sea igual al de JFLAP.
const desdeJff = (pos, escala = 0.7) => {
  const xs = Object.values(pos).map((p) => p[0]), ys = Object.values(pos).map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const lay = {};
  for (const [q, [x, y]] of Object.entries(pos)) lay[q] = [Math.round((x - cx) * escala), Math.round((y - cy) * escala)];
  return lay;
};

export const LAYOUT = {
  vagon: desdeJff({ Crudo: [120, 200], Precalentado: [320, 100], Cocido: [520, 100], Enfriado: [520, 300], Quebrado: [320, 300] }),
  maquina: desdeJff({ Lista: [120, 150], Operando: [340, 150], Falla: [340, 330] }),
};
