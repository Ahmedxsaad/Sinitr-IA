'use client';

import { useState } from 'react';
import type { AccidentEvidenceTwin, ImpactArea, Locale } from '@sinistria/contracts';

// Mirrors the ImpactArea vocabulary from the contract for the direction picker.
const DIRECTIONS: ImpactArea[] = [
  'front',
  'front_left',
  'front_right',
  'rear',
  'rear_left',
  'rear_right',
  'left',
  'right',
  'unknown',
];

/** The scripted honest demo case, matching the seeded fixtures. */
const HONEST_DEMO = {
  locale: 'derja' as Locale,
  narrative:
    'Kont wa9ef fel feu rouge, karhba jet men wara w darbitni fel porte arriere gauche. Personne blesse, famma ken degats. Plaque 125 TUN 4587.',
  collisionDirection: 'rear_left' as ImpactArea,
  phone: '+21620000001',
  evidence: { photo: true, constat: true, invoice: true },
};

/**
 * The scripted suspicious demo case. The reported direction (rear left)
 * deliberately does not match the seeded visible damage (front right), and the
 * garage phone matches one already seeded against a prior claim, so both the
 * consistency check and the relationship graph have something to flag.
 */
const SUSPICIOUS_DEMO = {
  locale: 'derja' as Locale,
  narrative:
    "L'accident sar fel rond point, karhba darbitni fel arriere gauche. Personne blesse. Plaque 200 TUN 3020.",
  collisionDirection: 'rear_left' as ImpactArea,
  phone: '+21620000055',
  garagePhone: '+21620000009',
  evidence: { photo: true, constat: true, invoice: true },
};

export default function ReportPage() {
  const [injuryReported, setInjuryReported] = useState<boolean | null>(null);
  const [narrative, setNarrative] = useState('');
  const [collisionDirection, setCollisionDirection] = useState<ImpactArea>('unknown');
  const [phone, setPhone] = useState('');
  const [garagePhone, setGaragePhone] = useState('');
  const [evidence, setEvidence] = useState({ photo: false, constat: false, invoice: false });
  // Tracks which seed media the guided-capture checkboxes should resolve to.
  // Manual entry and the honest demo both use the 'honest' seed set; only the
  // suspicious demo switches this, since that is the only case with evidence
  // deliberately seeded to contradict the reported story.
  const [demoCase, setDemoCase] = useState<'honest' | 'suspicious'>('honest');

  const [twin, setTwin] = useState<AccidentEvidenceTwin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function loadHonestDemo() {
    setDemoCase('honest');
    setInjuryReported(false);
    setNarrative(HONEST_DEMO.narrative);
    setCollisionDirection(HONEST_DEMO.collisionDirection);
    setPhone(HONEST_DEMO.phone);
    setGaragePhone('');
    setEvidence(HONEST_DEMO.evidence);
    setTwin(null);
    setError(null);
  }

  function loadSuspiciousDemo() {
    setDemoCase('suspicious');
    setInjuryReported(false);
    setNarrative(SUSPICIOUS_DEMO.narrative);
    setCollisionDirection(SUSPICIOUS_DEMO.collisionDirection);
    setPhone(SUSPICIOUS_DEMO.phone);
    setGaragePhone(SUSPICIOUS_DEMO.garagePhone);
    setEvidence(SUSPICIOUS_DEMO.evidence);
    setTwin(null);
    setError(null);
  }

  // Turn the guided-capture checkboxes into the seed refs the mock adapters read.
  function buildMediaRefs(): string[] {
    const refs: string[] = [];
    if (demoCase === 'suspicious') {
      // Fixed area/severity that intentionally does not match collisionDirection.
      if (evidence.photo) refs.push('seed:suspicious:vision:front_right:moderate');
      if (evidence.constat) refs.push('seed:suspicious:doc:constat:standard');
      if (evidence.invoice) refs.push('seed:suspicious:doc:invoice:engine');
    } else {
      if (evidence.photo) refs.push(`seed:honest:vision:${collisionDirection}:cosmetic`);
      if (evidence.constat) refs.push('seed:honest:doc:constat:standard');
      if (evidence.invoice) refs.push('seed:honest:doc:invoice:body_panel');
    }
    return refs;
  }

  async function submit() {
    setError(null);
    if (injuryReported === null) {
      setError('Please answer the safety question first.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          locale: 'derja',
          narrative,
          injuryReported,
          collisionDirection,
          contact: { phone },
          confirmed: true,
          mediaRefs: buildMediaRefs(),
          garagePhone: garagePhone || undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(`The report could not be submitted (status ${response.status}).`);
      }
      setTwin((await response.json()) as AccidentEvidenceTwin);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unexpected error.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="phone">
      <h1>AMIN</h1>
      <p className="assistant">I am here to help. Let us capture what happened, calmly.</p>

      {!twin && (
        <>
          <div className="card">
            <label>Is anyone injured or in danger?</label>
            <div className="toggle">
              <button
                type="button"
                className="secondary"
                aria-pressed={injuryReported === false}
                onClick={() => setInjuryReported(false)}
              >
                No, just damage
              </button>
              <button
                type="button"
                className="secondary"
                aria-pressed={injuryReported === true}
                onClick={() => setInjuryReported(true)}
              >
                Yes
              </button>
            </div>
          </div>

          <div className="card">
            <label htmlFor="narrative">Tell me what happened (Derja or French)</label>
            <textarea
              id="narrative"
              rows={4}
              value={narrative}
              onChange={(event) => setNarrative(event.target.value)}
              placeholder="Kont wa9ef..."
            />
          </div>

          <div className="card">
            <label htmlFor="direction">Where was the impact?</label>
            <select
              id="direction"
              value={collisionDirection}
              onChange={(event) => setCollisionDirection(event.target.value as ImpactArea)}
            >
              {DIRECTIONS.map((direction) => (
                <option key={direction} value={direction}>
                  {direction.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="card">
            <label>Evidence captured</label>
            {(['photo', 'constat', 'invoice'] as const).map((key) => (
              <div key={key}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto' }}
                    checked={evidence[key]}
                    onChange={(event) => setEvidence({ ...evidence, [key]: event.target.checked })}
                  />
                  {key === 'photo'
                    ? 'Damage photo'
                    : key === 'constat'
                      ? 'Constat'
                      : 'Repair invoice'}
                </label>
              </div>
            ))}
          </div>

          <div className="card">
            <label htmlFor="phone">Your phone number</label>
            <input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
            <label htmlFor="garage-phone">Garage phone (optional)</label>
            <input
              id="garage-phone"
              value={garagePhone}
              onChange={(event) => setGaragePhone(event.target.value)}
            />
          </div>

          {error && <p className="error">{error}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit report'}
            </button>
            <button type="button" className="secondary" onClick={loadHonestDemo}>
              Load demo case
            </button>
            <button type="button" className="secondary" onClick={loadSuspiciousDemo}>
              Load suspicious demo
            </button>
          </div>
        </>
      )}

      {twin && (
        <div className="card result">
          <p className="route">{twin.recommendation?.route.replace('_', ' ') ?? twin.state}</p>
          <p>
            Claim <strong>{twin.claimId}</strong> was prepared. An adjuster owns the final decision.
          </p>
          {twin.completeness && (
            <>
              <label>Evidence completeness {twin.completeness.score}%</label>
              <div className="meter">
                <span style={{ width: `${twin.completeness.score}%` }} />
              </div>
            </>
          )}
          {twin.recommendation && (
            <p className="assistant">{twin.recommendation.draftCustomerMessage}</p>
          )}
          <button type="button" className="secondary" onClick={() => setTwin(null)}>
            Report another
          </button>
        </div>
      )}
    </main>
  );
}
