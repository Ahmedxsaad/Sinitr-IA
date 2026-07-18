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

export default function ReportPage() {
  const [injuryReported, setInjuryReported] = useState<boolean | null>(null);
  const [narrative, setNarrative] = useState('');
  const [collisionDirection, setCollisionDirection] = useState<ImpactArea>('unknown');
  const [phone, setPhone] = useState('');
  const [evidence, setEvidence] = useState({ photo: false, constat: false, invoice: false });

  const [twin, setTwin] = useState<AccidentEvidenceTwin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function loadHonestDemo() {
    setInjuryReported(false);
    setNarrative(HONEST_DEMO.narrative);
    setCollisionDirection(HONEST_DEMO.collisionDirection);
    setPhone(HONEST_DEMO.phone);
    setEvidence(HONEST_DEMO.evidence);
    setTwin(null);
    setError(null);
  }

  // Turn the guided-capture checkboxes into the seed refs the mock adapters read.
  function buildMediaRefs(): string[] {
    const refs: string[] = [];
    if (evidence.photo) refs.push(`seed:honest:vision:${collisionDirection}:cosmetic`);
    if (evidence.constat) refs.push('seed:honest:doc:constat:standard');
    if (evidence.invoice) refs.push('seed:honest:doc:invoice:body_panel');
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
          </div>

          {error && <p className="error">{error}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit report'}
            </button>
            <button type="button" className="secondary" onClick={loadHonestDemo}>
              Load demo case
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
