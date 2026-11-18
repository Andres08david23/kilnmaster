import { readFileSync } from 'node:fs';

export const cargar = (nombre) =>
  JSON.parse(readFileSync(new URL(`../src/sed/modelos/${nombre}.json`, import.meta.url), 'utf8'));
