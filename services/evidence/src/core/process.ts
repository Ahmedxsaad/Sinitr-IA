/**
 * Evidence's single entry point. Runs the mock vision and OCR adapters, then
 * builds the damage, consistency, and completeness sections of the Twin.
 */
import type { EvidenceRequest, EvidenceResult } from '@sinistria/contracts';
import { MockOcrAdapter, type OcrAdapter } from '../adapters/ocr.js';
import { MockVisionAdapter, type VisionAdapter } from '../adapters/vision.js';
import { buildDamageEvidence } from './damage.js';
import { checkConsistency } from './consistency.js';
import { scoreCompleteness } from './completeness.js';

const defaultVision: VisionAdapter = new MockVisionAdapter();
const defaultOcr: OcrAdapter = new MockOcrAdapter();

/**
 * Process an evidence request into the damage, consistency, and completeness
 * sections.
 *
 * @param request - a validated evidence request.
 * @param vision - the vision adapter (defaults to the mock).
 * @param ocr - the OCR adapter (defaults to the mock).
 */
export async function processEvidence(
  request: EvidenceRequest,
  vision: VisionAdapter = defaultVision,
  ocr: OcrAdapter = defaultOcr,
): Promise<EvidenceResult> {
  const regions = await vision.assessDamage(request.mediaRefs);
  const documents = await ocr.extract(request.mediaRefs);

  return {
    damage: buildDamageEvidence(regions),
    consistency: checkConsistency(request.fnol, regions, documents),
    completeness: scoreCompleteness(request.fnol, regions, documents),
  };
}
