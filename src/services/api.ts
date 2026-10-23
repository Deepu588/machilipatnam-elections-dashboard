/**
 * Data-access layer. Components never call fetch directly.
 * The "mock API" is a set of static JSON files in /public/data, served by Vite.
 * To use a real backend later, only the BASE URL / these functions need to change.
 */
import type { AssemblyData, Constituency, ParliamentData } from '../types';
import { normalizeAssembly, normalizeParliament } from './normalize';

const BASE = `${import.meta.env.BASE_URL}data/`;

async function getJson<T>(file: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${file}`);
  } catch {
    throw new Error(`Network error while loading ${file}.`);
  }
  if (!res.ok) throw new Error(`Could not load ${file} (HTTP ${res.status}).`);
  try {
    return (await res.json()) as T;
  } catch {
    throw new Error(`${file} is not valid JSON.`);
  }
}

export const api = {
  getConstituency: () => getJson<Constituency>('constituency.json'),
  getParliament: async () => normalizeParliament(await getJson<ParliamentData>('parliament.json')),
  getAssembly: async () => normalizeAssembly(await getJson<AssemblyData>('assembly.json')),
};
