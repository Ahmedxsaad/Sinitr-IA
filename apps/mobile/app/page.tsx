'use client';

import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { AccidentEvidenceTwin, ImpactArea, Locale } from '@sinistria/contracts';
import { BrandMark, ConfidenceBadge, RouteBadge } from '@sinistria/ui';

/** Sets the --rise-delay custom property the .rise animation reads, so a
 * sequence of cards can stagger in one after another. */
function riseDelay(seconds: number): CSSProperties {
  return { '--rise-delay': `${seconds}s` } as CSSProperties;
}

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

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'derja', label: 'Derja' },
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية' },
];

/** "0:07" for a duration in seconds, "0:00" while metadata is not loaded yet. */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function ReportPage() {
  const [locale, setLocale] = useState<Locale>('derja');
  const [injuryReported, setInjuryReported] = useState<boolean | null>(null);
  const [voiceState, setVoiceState] = useState<'idle' | 'playing' | 'revealed'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  // Types the transcript out a character at a time, as if it just arrived from
  // the voice note, then hands the form to the rest of the guided journey.
  function revealNarrative(fullText: string) {
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    setNarrative('');
    let index = 0;
    typewriterRef.current = setInterval(() => {
      index += 1;
      setNarrative(fullText.slice(0, index));
      if (index >= fullText.length) {
        if (typewriterRef.current) clearInterval(typewriterRef.current);
        setVoiceState('revealed');
      }
    }, 24);
  }

  function startVoiceCapture() {
    setVoiceState('playing');
    setNarrative('');
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      void audio.play();
    }
  }

  function skipVoiceCapture() {
    setVoiceState('revealed');
  }

  function loadHonestDemo() {
    setDemoCase('honest');
    setLocale(HONEST_DEMO.locale);
    setInjuryReported(false);
    setVoiceState('idle');
    setNarrative('');
    setCollisionDirection(HONEST_DEMO.collisionDirection);
    setPhone(HONEST_DEMO.phone);
    setGaragePhone('');
    setEvidence(HONEST_DEMO.evidence);
    setTwin(null);
    setError(null);
  }

  function loadSuspiciousDemo() {
    setDemoCase('suspicious');
    setLocale(SUSPICIOUS_DEMO.locale);
    setInjuryReported(false);
    setVoiceState('revealed');
    setNarrative(SUSPICIOUS_DEMO.narrative);
    setCollisionDirection(SUSPICIOUS_DEMO.collisionDirection);
    setPhone(SUSPICIOUS_DEMO.phone);
    setGaragePhone(SUSPICIOUS_DEMO.garagePhone);
    setEvidence(SUSPICIOUS_DEMO.evidence);
    setTwin(null);
    setError(null);
  }

  function reportAnother() {
    setTwin(null);
    setVoiceState('idle');
    setNarrative('');
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
          locale,
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

  const isRtl = locale === 'ar';

  return (
    <main className="phone" dir={isRtl ? 'rtl' : undefined} lang={isRtl ? 'ar' : undefined}>
      <header className="brand rise">
        <span className="brand-mark">
          <BrandMark size={26} />
        </span>
        <span>
          <span className="brand-name">Sinistr&apos;IA</span>
          <br />
          <span className="brand-tag">AI accident witness</span>
        </span>
      </header>

      <div className="hero rise" style={riseDelay(0.05)}>
        <h1>Let us capture what happened.</h1>
        <p className="assistant">
          I am AMIN. Take a breath, then tell me in your own words. I will guide you, one step at a
          time.
        </p>
      </div>

      {!twin && (
        <>
          <div className="card rise" style={riseDelay(0.1)}>
            <span id="locale-label" className="group-label">
              Language
            </span>
            <div className="toggle" role="group" aria-labelledby="locale-label">
              {LOCALES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="secondary"
                  aria-pressed={locale === option.value}
                  onClick={() => setLocale(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card rise" style={riseDelay(0.16)}>
            <span id="safety-label" className="group-label">
              Is anyone injured or in danger?
            </span>
            <div className="toggle" role="group" aria-labelledby="safety-label">
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

          <div className="card rise" style={riseDelay(0.22)}>
            {voiceState !== 'revealed' && (
              <span id="voice-label" className="group-label">
                Tell me what happened
              </span>
            )}

            {voiceState === 'idle' && (
              <div className="voice-capture">
                <button
                  type="button"
                  className="mic-button"
                  aria-label="Record your voice"
                  onClick={startVoiceCapture}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="9" y="2.5" width="6" height="11" rx="3" fill="currentColor" />
                    <path
                      d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18.5v3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <p className="assistant">Tap to record your voice</p>
                <button type="button" className="secondary small-link" onClick={skipVoiceCapture}>
                  Type instead
                </button>
              </div>
            )}

            {voiceState === 'playing' && (
              <div className="voice-capture" aria-live="polite">
                <div className="waveform" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <p className="assistant">
                  Listening... {formatTime(elapsed)} / {formatTime(duration)}
                </p>
              </div>
            )}

            {voiceState === 'revealed' && (
              <>
                <label htmlFor="narrative">Tell me what happened (Derja, French, or Arabic)</label>
                <textarea
                  id="narrative"
                  rows={4}
                  value={narrative}
                  onChange={(event) => setNarrative(event.target.value)}
                  placeholder="Kont wa9ef..."
                />
                <button type="button" className="secondary small-link" onClick={startVoiceCapture}>
                  Replay voice note
                </button>
              </>
            )}

            <audio
              ref={audioRef}
              src="/audio/honest-demo.mp3"
              preload="auto"
              onEnded={() => revealNarrative(HONEST_DEMO.narrative)}
              onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
              onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
            />
          </div>

          <div className="demo-row">
            <button type="button" className="secondary" onClick={loadHonestDemo}>
              Load demo case
            </button>
            <button type="button" className="secondary" onClick={loadSuspiciousDemo}>
              Load suspicious demo
            </button>
          </div>

          {voiceState === 'revealed' && (
            <>
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
                        onChange={(event) =>
                          setEvidence({ ...evidence, [key]: event.target.checked })
                        }
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
                <input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
                <label htmlFor="garage-phone">Garage phone (optional)</label>
                <input
                  id="garage-phone"
                  value={garagePhone}
                  onChange={(event) => setGaragePhone(event.target.value)}
                />
              </div>

              {error && <p className="error">{error}</p>}

              <div className="actions">
                <button type="button" onClick={submit} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit report'}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {twin && (
        <div className="card result rise">
          <div className="result-headline">
            {twin.recommendation ? (
              <RouteBadge route={twin.recommendation.route} />
            ) : (
              <span className="muted">{twin.state}</span>
            )}
            <ConfidenceBadge confidence={twin.overallConfidence.label} />
          </div>
          <p>
            Claim <strong className="claim-id">{twin.claimId}</strong> was prepared. An adjuster
            owns the final decision.
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
          <button type="button" className="secondary" onClick={reportAnother}>
            Report another
          </button>
        </div>
      )}
    </main>
  );
}
