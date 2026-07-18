'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { SignalEvent, SignalRegion, SignalsResult } from '@sinistria/contracts';
import { CriticalityBadge } from '@sinistria/ui';

/** Sets the --rise-delay custom property the .rise animation reads, so a
 * sequence of cards can stagger in one after another. */
function riseDelay(seconds: number): CSSProperties {
  return { '--rise-delay': `${seconds}s` } as CSSProperties;
}

const REGIONS: { id: SignalRegion; label: string }[] = [
  { id: 'tunisia', label: 'Tunisia' },
  { id: 'africa', label: 'Africa' },
];

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function SignalCard({ event, delaySeconds }: { event: SignalEvent; delaySeconds: number }) {
  return (
    <div className="card rise" style={riseDelay(delaySeconds)}>
      <p>
        <CriticalityBadge criticality={event.criticality} />{' '}
        {event.relevance.map((relevance) => (
          <span key={relevance} className="tag">
            {relevance}
          </span>
        ))}
      </p>
      <h3>{event.title}</h3>
      {event.summary && <p className="muted">{event.summary}</p>}
      <p>{event.assessment}</p>
      <p className="small muted">
        {formatDate(event.publishedAt)} | classifier confidence: {event.confidence.label} |{' '}
        <a href={event.url} target="_blank" rel="noreferrer">
          source
        </a>
      </p>
    </div>
  );
}

export default function SignalsPage() {
  const [region, setRegion] = useState<SignalRegion>('tunisia');
  const [result, setResult] = useState<SignalsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (target: SignalRegion) => {
    setError(null);
    const response = await fetch(`/api/signals?region=${target}`);
    if (!response.ok) throw new Error(`Failed to load signals (status ${response.status}).`);
    setResult((await response.json()) as SignalsResult);
  }, []);

  useEffect(() => {
    load(region).catch((caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'Unexpected error.'),
    );
  }, [load, region]);

  return (
    <main className="page">
      <p className="rise">
        <a href="/">&larr; Back to queue</a>
      </p>
      <h1 className="rise" style={riseDelay(0.03)}>
        Situational signals
      </h1>
      <p className="muted rise" style={riseDelay(0.05)}>
        Regional events that may bear on motor claims. Awareness only: these are not linked to any
        claim and never drive a decision.
      </p>

      <div className="tabs rise" style={riseDelay(0.08)}>
        {REGIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={option.id === region ? '' : 'secondary'}
            onClick={() => setRegion(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && <p className="chip">{error}</p>}

      {result && result.events.length === 0 && <p className="muted">No signals for this region.</p>}
      {result?.events.map((event, index) => (
        <SignalCard key={event.id} event={event} delaySeconds={0.1 + index * 0.06} />
      ))}
    </main>
  );
}
