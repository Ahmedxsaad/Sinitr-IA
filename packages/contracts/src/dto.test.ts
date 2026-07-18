import { describe, expect, it } from 'vitest';
import { createClaimRequestSchema, intakeRequestSchema } from './dto.js';

const validClaim = {
  locale: 'derja' as const,
  narrative: 'A collision was reported.',
  injuryReported: false,
  contact: { phone: '+21620000001' },
  confirmed: true as const,
  mediaRefs: [],
};

describe('claim boundary schemas', () => {
  it('rejects an unconfirmed customer report before processing', () => {
    expect(createClaimRequestSchema.safeParse({ ...validClaim, confirmed: false }).success).toBe(
      false,
    );
  });

  it('rejects oversized narratives and media lists', () => {
    expect(
      createClaimRequestSchema.safeParse({ ...validClaim, narrative: 'x'.repeat(10_001) }).success,
    ).toBe(false);
    expect(
      createClaimRequestSchema.safeParse({
        ...validClaim,
        mediaRefs: Array.from({ length: 101 }, (_, index) => `media-${index}`),
      }).success,
    ).toBe(false);
  });

  it('requires internal intake requests to carry confirmed facts too', () => {
    const request = {
      claimId: 'CLM-1',
      correlationId: 'corr-1',
      locale: 'derja' as const,
      narrative: validClaim.narrative,
      injuryReported: false,
      confirmed: false,
      mediaRefs: [],
    };
    expect(intakeRequestSchema.safeParse(request).success).toBe(false);
  });
});
