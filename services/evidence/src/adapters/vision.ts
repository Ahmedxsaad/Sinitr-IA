/**
 * Damage localization behind a provider-agnostic interface. The mock reads seed
 * refs so the demo is deterministic; a real vision provider would analyze the
 * actual image bytes and return the same shape.
 */
import {
  type DamageRegion,
  damageSeveritySchema,
  impactAreaSchema,
  makeConfidence,
} from '@sinistria/contracts';
import { parseSeedRef } from './seed-ref.js';

export interface VisionAdapter {
  /** Localize visible damage from the given media references. */
  assessDamage(mediaRefs: string[]): Promise<DamageRegion[]>;
}

/**
 * Deterministic mock. For each `seed:<case>:vision:<area>:<severity>` ref it
 * emits one localized damage region, validating the area and severity against
 * the shared enums so a malformed seed cannot produce an invalid region.
 */
export class MockVisionAdapter implements VisionAdapter {
  async assessDamage(mediaRefs: string[]): Promise<DamageRegion[]> {
    const regions: DamageRegion[] = [];
    for (const ref of mediaRefs) {
      const parsed = parseSeedRef(ref);
      if (!parsed || parsed.kind !== 'vision') continue;

      const area = impactAreaSchema.safeParse(parsed.a);
      const severity = damageSeveritySchema.safeParse(parsed.b);
      if (!area.success || !severity.success) continue;

      regions.push({
        area: area.data,
        severity: severity.data,
        confidence: makeConfidence(0.88),
      });
    }
    return regions;
  }
}
