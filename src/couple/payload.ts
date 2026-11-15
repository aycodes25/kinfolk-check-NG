import type { CouplePerson } from '../domain/couple';

const GENOTYPES = ['AA', 'AS', 'SS', 'AC', 'SC'];
const ABOS = ['A', 'B', 'AB', 'O'];
const RHS = ['+', '-'];
const VERSION = 1;

export function encodePayload(p: CouplePerson): string {
  return JSON.stringify({ v: VERSION, g: p.genotype, b: p.bloodGroup.abo, r: p.bloodGroup.rh });
}

export function decodePayload(text: string): CouplePerson | null {
  try {
    const o = JSON.parse(text);
    if (!o || typeof o !== 'object') return null;
    const keys = Object.keys(o).sort().join(',');
    if (keys !== 'b,g,r,v') return null;
    if (o.v !== VERSION) return null;
    if (!GENOTYPES.includes(o.g) || !ABOS.includes(o.b) || !RHS.includes(o.r)) return null;
    return { genotype: o.g, bloodGroup: { abo: o.b, rh: o.r } };
  } catch {
    return null;
  }
}
