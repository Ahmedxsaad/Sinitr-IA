/**
 * Graph's single entry point.
 */
import type { GraphRequest, GraphResult } from '@sinistria/contracts';
import { detectAnomalies } from './anomalies.js';
import { buildGraphView } from './view.js';

/** Process a graph request into the anomaly flags and relationship-graph view for the claim. */
export async function processGraph(request: GraphRequest): Promise<GraphResult> {
  const anomalies = detectAnomalies(request);
  return { anomalies, view: buildGraphView(request, anomalies) };
}
