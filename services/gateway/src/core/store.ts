/**
 * SQLite-backed claim store. Claims survive a service restart; the Twin is
 * kept as validated JSON so the shared schema stays the single source of
 * truth for its shape, not a hand-mirrored set of columns. The customer
 * contact phone lives alongside it, deliberately kept out of the Twin
 * (data minimization) but needed by the notify step.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConfig } from '@sinistria/config';
import { type AccidentEvidenceTwin, accidentEvidenceTwinSchema } from '@sinistria/contracts';
import Database from 'better-sqlite3';

export interface ClaimRecord {
  twin: AccidentEvidenceTwin;
  /** Kept out of the Twin so the shared object holds no unnecessary PII. */
  contactPhone: string;
}

interface ClaimRow {
  twin: string;
  contact_phone: string;
}

const here = path.dirname(fileURLToPath(import.meta.url));
/** Four levels up from services/gateway/src/core puts this at the repo root. */
const DEFAULT_DB_PATH = path.resolve(here, '../../../../data/local/claims.db');

function openDatabase(dbPath: string): Database.Database {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS claims (
      claim_id TEXT PRIMARY KEY,
      twin TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  return db;
}

function toRecord(row: ClaimRow): ClaimRecord {
  return {
    twin: accidentEvidenceTwinSchema.parse(JSON.parse(row.twin)),
    contactPhone: row.contact_phone,
  };
}

export class ClaimStore {
  private readonly db: Database.Database;

  constructor(dbPath: string = getConfig().DATABASE_PATH ?? DEFAULT_DB_PATH) {
    this.db = openDatabase(dbPath);
  }

  save(record: ClaimRecord): void {
    this.db
      .prepare(
        `INSERT INTO claims (claim_id, twin, contact_phone, updated_at)
         VALUES (@claimId, @twin, @contactPhone, @updatedAt)
         ON CONFLICT(claim_id) DO UPDATE SET
           twin = excluded.twin,
           contact_phone = excluded.contact_phone,
           updated_at = excluded.updated_at`,
      )
      .run({
        claimId: record.twin.claimId,
        twin: JSON.stringify(record.twin),
        contactPhone: record.contactPhone,
        updatedAt: new Date().toISOString(),
      });
  }

  get(claimId: string): ClaimRecord | undefined {
    const row = this.db
      .prepare('SELECT twin, contact_phone FROM claims WHERE claim_id = ?')
      .get(claimId) as ClaimRow | undefined;
    return row ? toRecord(row) : undefined;
  }

  list(): ClaimRecord[] {
    const rows = this.db
      .prepare('SELECT twin, contact_phone FROM claims ORDER BY rowid ASC')
      .all() as ClaimRow[];
    return rows.map(toRecord);
  }

  /** Closes the underlying database file. Used by tests and graceful shutdown. */
  close(): void {
    this.db.close();
  }
}

/** Process-wide store instance. */
export const claimStore = new ClaimStore();
