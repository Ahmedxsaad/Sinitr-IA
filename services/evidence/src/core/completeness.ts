/**
 * Score how complete the evidence is and name what is still missing, so the
 * mobile app can ask for the single most valuable next item. This is what turns
 * passive upload into guided capture.
 */
import type { Completeness, DamageRegion, Fnol } from '@sinistria/contracts';
import type { ExtractedDocument } from '../adapters/ocr.js';

/** One deduction: how many points a missing item costs and how to ask for it. */
interface Requirement {
  present: boolean;
  penalty: number;
  prompt: string;
}

/** Score completeness from 0 to 100 and list the missing items in priority order. */
export function scoreCompleteness(
  fnol: Fnol,
  regions: DamageRegion[],
  documents: ExtractedDocument[],
): Completeness {
  // Ordered by value, so the highest-penalty gap becomes the next-best prompt.
  const requirements: Requirement[] = [
    {
      present: regions.length > 0,
      penalty: 40,
      prompt: 'A clear photo of the damaged area',
    },
    {
      present: documents.some((document) => document.type === 'constat'),
      penalty: 20,
      prompt: 'The constat (accident report)',
    },
    {
      present: documents.some((document) => document.type === 'invoice'),
      penalty: 15,
      prompt: 'A repair invoice',
    },
    {
      present: fnol.timeline.collisionDirection.value !== 'unknown',
      penalty: 10,
      prompt: 'The direction of impact',
    },
    {
      present: fnol.structuredFacts.location.value !== 'Unknown',
      penalty: 5,
      prompt: 'The accident location',
    },
  ];

  let score = 100;
  const missing: string[] = [];
  for (const requirement of requirements) {
    if (!requirement.present) {
      score -= requirement.penalty;
      missing.push(requirement.prompt);
    }
  }

  score = Math.max(0, Math.min(100, score));
  return { score, missing, nextBestPrompt: missing[0] };
}
