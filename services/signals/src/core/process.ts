/**
 * Signals' single entry point. Fetches the raw feed for a region, classifies
 * every item with the deterministic rules, and returns the events ordered
 * most-serious first. Wiring it here means the Fastify route and any in-process
 * caller exercise exactly the same logic.
 */
import type { SignalRegion, SignalsResult } from '@sinistria/contracts';
import { MockFeedAdapter, type FeedAdapter } from '../adapters/feed.js';
import { classifyEvent, sortByCriticality } from './classify.js';

/** The default demo-mode feed adapter. Swap for a live RSS provider later. */
const defaultFeed: FeedAdapter = new MockFeedAdapter();

/**
 * Process a region into its classified, ordered signal events.
 *
 * @param region - the region to pull signals for.
 * @param feed - the feed adapter to use (defaults to the offline mock).
 */
export async function processSignals(
  region: SignalRegion,
  feed: FeedAdapter = defaultFeed,
): Promise<SignalsResult> {
  const rawItems = await feed.fetchRaw(region);
  const events = sortByCriticality(rawItems.map((item) => classifyEvent(region, item)));

  return {
    region,
    generatedAt: new Date().toISOString(),
    events,
  };
}
