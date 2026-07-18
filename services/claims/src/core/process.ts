/**
 * Claims' single entry point. Grounds coverage, then produces the routed
 * recommendation and overall confidence.
 */
import type { RecommendRequest, RecommendResult } from '@sinistria/contracts';
import { groundCoverage } from './coverage.js';
import { recommend } from './recommend.js';

/** Process a recommend request into coverage, a recommendation, and confidence. */
export async function processRecommend(request: RecommendRequest): Promise<RecommendResult> {
  const coverage = groundCoverage(request.evidence.damage);

  return recommend({
    coverage,
    consistency: request.evidence.consistency,
    completeness: request.evidence.completeness,
    damage: request.evidence.damage,
    anomalies: request.anomalies,
  });
}
