/**
 * OCR and document structuring behind a provider-agnostic interface. The mock
 * reads seed refs; a real OCR provider would read the actual document image.
 */
import { parseSeedRef } from './seed-ref.js';

export interface ExtractedDocument {
  /** Document type, for example "constat" or "invoice". */
  type: string;
  /** A structured category, for example "body_panel" for an invoice line. */
  category: string;
}

export interface OcrAdapter {
  /** Extract structured documents from the given media references. */
  extract(mediaRefs: string[]): Promise<ExtractedDocument[]>;
}

/**
 * Deterministic mock. For each `seed:<case>:doc:<type>:<category>` ref it emits
 * one structured document.
 */
export class MockOcrAdapter implements OcrAdapter {
  async extract(mediaRefs: string[]): Promise<ExtractedDocument[]> {
    const documents: ExtractedDocument[] = [];
    for (const ref of mediaRefs) {
      const parsed = parseSeedRef(ref);
      if (!parsed || parsed.kind !== 'doc') continue;
      documents.push({ type: parsed.a, category: parsed.b });
    }
    return documents;
  }
}
