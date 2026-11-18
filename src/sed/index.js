// Punto único de acceso al núcleo formal: carga los modelos JSON y expone las clases.
import vagon from './modelos/vagon.json' with { type: 'json' };
import maquinaSimple from './modelos/maquina_simple.json' with { type: 'json' };
import recetaTermica from './modelos/receta_termica.json' with { type: 'json' };
import redN1 from './modelos/red_n1.json' with { type: 'json' };
import redN2 from './modelos/red_n2.json' with { type: 'json' };

export { Automata } from './automata.js';
export { componer, supervisor } from './composicion.js';
export { Observador } from './observador.js';
export { Lenguaje } from './lenguaje.js';
export { RedPetri } from './redPetri.js';
export { arbolCobertura, explorar, colorRadar } from './cobertura.js';
export { Reloj } from './reloj.js';
export { Aleatorio } from './aleatorio.js';
export const MODELOS = { vagon, maquinaSimple, recetaTermica, redN1, redN2 };
