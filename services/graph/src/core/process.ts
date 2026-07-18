/**
 * Graph's single entry point.
 */
import type { GraphRequest, GraphResult } from '@sinistria/contracts';
import { detectAnomalies } from './anomalies.js';

/** Process a graph request into the list of anomaly flags for the claim. */
export async function processGraph(request: GraphRequest): Promise<GraphResult> {
  return { anomalies: detectAnomalies(request) };
}
