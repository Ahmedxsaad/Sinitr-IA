/**
 * The gateway's view of the other services. The pipeline depends on this
 * interface, not on HTTP, which lets the integration test run the exact same
 * orchestration in-process by supplying clients backed by each service's core.
 */
import { getServiceUrls } from '@sinistria/config';
import type {
  EvidenceRequest,
  EvidenceResult,
  GraphRequest,
  GraphResult,
  IntakeRequest,
  IntakeResult,
  NotifyRequest,
  NotifyResult,
  RecommendRequest,
  RecommendResult,
} from '@sinistria/contracts';

export interface ServiceClients {
  intake(request: IntakeRequest): Promise<IntakeResult>;
  evidence(request: EvidenceRequest): Promise<EvidenceResult>;
  graph(request: GraphRequest): Promise<GraphResult>;
  claims(request: RecommendRequest): Promise<RecommendResult>;
  notify(request: NotifyRequest): Promise<NotifyResult>;
}

/** POST a JSON body to a service and return its parsed JSON response. */
async function postJson<TResponse>(
  url: string,
  body: unknown,
  correlationId: string,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-correlation-id': correlationId },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Service call to ${url} failed with ${response.status}: ${detail}`);
  }
  return (await response.json()) as TResponse;
}

/**
 * Build clients that reach the real services over HTTP. Each request already
 * carries its correlation id, which is forwarded as a header so the trace
 * survives across the network hop.
 */
export function createHttpClients(): ServiceClients {
  const urls = getServiceUrls();
  return {
    intake: (request) =>
      postJson<IntakeResult>(`${urls.intake}/intake`, request, request.correlationId),
    evidence: (request) =>
      postJson<EvidenceResult>(`${urls.evidence}/evidence`, request, request.correlationId),
    graph: (request) =>
      postJson<GraphResult>(`${urls.graph}/graph`, request, request.correlationId),
    claims: (request) =>
      postJson<RecommendResult>(`${urls.claims}/recommend`, request, request.correlationId),
    notify: (request) =>
      postJson<NotifyResult>(`${urls.notify}/notify`, request, request.correlationId),
  };
}
