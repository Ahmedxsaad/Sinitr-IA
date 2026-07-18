/**
 * The news feed behind a provider-agnostic interface, exactly like the mock
 * speech, vision, and OCR adapters. The mock reads the seeded fixtures in
 * `data/signals` so the situational feed is fully offline and deterministic for
 * the demo. A live adapter (Google News RSS) would implement the same interface
 * and is only used outside demo mode; it is a deliberate follow-up, not built
 * here.
 */
import { type RawNewsItem, type SignalRegion, signalsFixtureSchema } from '@sinistria/contracts';
import tunisiaFixture from '../../../../data/signals/tunisia.json';
import africaFixture from '../../../../data/signals/africa.json';

export interface FeedAdapter {
  /** Fetch the raw, unclassified news items for a region. */
  fetchRaw(region: SignalRegion): Promise<RawNewsItem[]>;
}

// Validate each seeded region file once at load, so a malformed edit fails fast
// rather than surfacing as an empty feed on stage.
const FIXTURES: Record<SignalRegion, RawNewsItem[]> = {
  tunisia: signalsFixtureSchema.parse(tunisiaFixture).items,
  africa: signalsFixtureSchema.parse(africaFixture).items,
};

/** Deterministic mock: returns the seeded raw items for the region. */
export class MockFeedAdapter implements FeedAdapter {
  async fetchRaw(region: SignalRegion): Promise<RawNewsItem[]> {
    return FIXTURES[region];
  }
}
