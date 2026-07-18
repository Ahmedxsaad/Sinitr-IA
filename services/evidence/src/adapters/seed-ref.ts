/**
 * The mock adapters read "seed refs" instead of real image or document bytes. A
 * seed ref encodes what a piece of media would show, so the demo is fully
 * deterministic and offline. A real adapter would analyze the actual file; the
 * mock simply reads the ref.
 *
 * Format: `seed:<case>:<kind>:<a>:<b>`
 *   vision -> seed:honest:vision:rear_left:cosmetic   (area, severity)
 *   doc    -> seed:honest:doc:invoice:body_panel      (document type, category)
 */

export interface ParsedSeedRef {
  case: string;
  kind: string;
  a: string;
  b: string;
}

/** Parse a seed ref, or return null if it is not one. */
export function parseSeedRef(ref: string): ParsedSeedRef | null {
  const parts = ref.split(':');
  if (parts.length !== 5) return null;
  const [prefix, caseName, kind, a, b] = parts;
  // The truthiness checks also narrow each segment from string | undefined to
  // string, which noUncheckedIndexedAccess requires.
  if (prefix !== 'seed' || !caseName || !kind || !a || !b) return null;
  return { case: caseName, kind, a, b };
}
