/**
 * In-memory claim store for the demo. It keeps the Twin alongside the customer
 * contact phone, which is deliberately kept out of the Twin (data minimization)
 * but is needed by the notify step. A real deployment replaces this with a
 * persistent store; the interface stays the same.
 */
import type { AccidentEvidenceTwin } from '@sinistria/contracts';

export interface ClaimRecord {
  twin: AccidentEvidenceTwin;
  /** Kept out of the Twin so the shared object holds no unnecessary PII. */
  contactPhone: string;
}

export class ClaimStore {
  private readonly records = new Map<string, ClaimRecord>();

  save(record: ClaimRecord): void {
    this.records.set(record.twin.claimId, record);
  }

  get(claimId: string): ClaimRecord | undefined {
    return this.records.get(claimId);
  }

  list(): ClaimRecord[] {
    return [...this.records.values()];
  }
}

/** Process-wide store instance for the demo. */
export const claimStore = new ClaimStore();
