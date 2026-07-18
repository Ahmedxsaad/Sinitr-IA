import { describe, expect, it } from 'vitest';
import type { DamageRegion, Fnol, ImpactArea } from '@sinistria/contracts';
import type { ExtractedDocument } from '../adapters/ocr.js';
import { scoreCompleteness } from './completeness.js';

const region: DamageRegion = {
  area: 'rear_left',
  severity: 'cosmetic',
  confidence: { label: 'high', score: 0.9 },
};

function fnolWith(direction: ImpactArea, location: string): Fnol {
  return {
    structuredFacts: {
      claimantStatement: {
        value: 'text',
        source: 'voice',
        confidence: { label: 'high', score: 0.9 },
      },
      occurredAt: {
        value: new Date().toISOString(),
        source: 'metadata',
        confidence: { label: 'high', score: 0.9 },
      },
      location: { value: location, source: 'derived', confidence: { label: 'low', score: 0.3 } },
      vehicles: [{ plate: 'UNKNOWN', isClaimant: true }],
    },
    timeline: {
      summary: { value: 'text', source: 'voice', confidence: { label: 'high', score: 0.9 } },
      sequence: ['a', 'b', 'c'],
      collisionDirection: {
        value: direction,
        source: 'voice',
        confidence: { label: 'high', score: 0.9 },
      },
    },
  };
}

describe('scoreCompleteness', () => {
  it('scores 100 with no missing items and no next-best prompt', () => {
    const documents: ExtractedDocument[] = [
      { type: 'constat', category: 'standard' },
      { type: 'invoice', category: 'body_panel' },
    ];
    const result = scoreCompleteness(fnolWith('rear_left', 'Tunis'), [region], documents);
    expect(result.score).toBe(100);
    expect(result.missing).toHaveLength(0);
    expect(result.nextBestPrompt).toBeUndefined();
  });

  it('deducts every penalty and lists every requirement when everything is missing', () => {
    // Penalties sum to 40 (photo) + 20 (constat) + 15 (invoice) + 10 (direction) + 5 (location) = 90.
    const result = scoreCompleteness(fnolWith('unknown', 'Unknown'), [], []);
    expect(result.score).toBe(10);
    expect(result.missing).toHaveLength(5);
  });

  it('deducts only the photo penalty and prompts for it first when only the photo is missing', () => {
    const documents: ExtractedDocument[] = [
      { type: 'constat', category: 'standard' },
      { type: 'invoice', category: 'body_panel' },
    ];
    const result = scoreCompleteness(fnolWith('rear_left', 'Tunis'), [], documents);
    expect(result.score).toBe(60); // 100 - 40 (photo)
    expect(result.missing).toEqual(['A clear photo of the damaged area']);
    expect(result.nextBestPrompt).toBe('A clear photo of the damaged area');
  });

  it('orders the next-best prompt by penalty weight, not by requirement order', () => {
    // Missing invoice (15) and location (5), but not photo, constat, or direction.
    const documents: ExtractedDocument[] = [{ type: 'constat', category: 'standard' }];
    const result = scoreCompleteness(fnolWith('rear_left', 'Unknown'), [region], documents);
    expect(result.score).toBe(80); // 100 - 15 (invoice) - 5 (location)
    expect(result.nextBestPrompt).toBe('A repair invoice');
  });

  it('never returns a negative score, guarding against a future penalty increase', () => {
    const result = scoreCompleteness(fnolWith('unknown', 'Unknown'), [], []);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
