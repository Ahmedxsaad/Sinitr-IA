import { describe, expect, it } from 'vitest';
import type { RawNewsItem } from '@sinistria/contracts';
import { classifyEvent, sortByCriticality } from './classify.js';

const item = (title: string, description = ''): RawNewsItem => ({
  title,
  description,
  url: 'https://example.com/tn/story',
  publishedAt: '2026-07-18T00:00:00Z',
});

describe('classifyEvent', () => {
  it('marks a disease outbreak as critical with health relevance', () => {
    const event = classifyEvent('africa', item('Cholera outbreak declared in coastal provinces'));
    expect(event.criticality).toBe('critical');
    expect(event.relevance).toContain('health');
    expect(event.confidence.label).toBe('high');
  });

  it('marks a flood as high with property and transport relevance', () => {
    const event = classifyEvent('tunisia', item('Flash floods submerge roads across Nabeul'));
    expect(event.criticality).toBe('high');
    expect(event.relevance).toEqual(['property', 'transport']);
  });

  it('marks a motorway collision as high with transport relevance', () => {
    const event = classifyEvent('tunisia', item('Multi-vehicle collision closes the A1 motorway'));
    expect(event.criticality).toBe('high');
    expect(event.relevance).toEqual(['transport']);
  });

  it('marks a strike as medium', () => {
    const event = classifyEvent('tunisia', item('Transport union announces one-day strike'));
    expect(event.criticality).toBe('medium');
  });

  it('classifies an unmatched item as a low-confidence general signal, never dropping it', () => {
    const event = classifyEvent('tunisia', item('Ministry announces summer festival programme'));
    expect(event.criticality).toBe('low');
    expect(event.relevance).toEqual(['general']);
    expect(event.confidence.label).toBe('low');
  });

  it('matches French-language terms as well as English', () => {
    const event = classifyEvent(
      'africa',
      item('Un seisme de magnitude 5.2 ressenti dans la region'),
    );
    expect(event.criticality).toBe('critical');
  });

  it('derives a stable id from the item url', () => {
    const first = classifyEvent('tunisia', item('Flooding hits the coast'));
    const second = classifyEvent('tunisia', item('Flooding hits the coast'));
    expect(first.id).toBe(second.id);
    expect(first.id.startsWith('tunisia:')).toBe(true);
  });
});

describe('sortByCriticality', () => {
  it('orders events most-serious first', () => {
    const events = [
      classifyEvent('tunisia', item('summer festival programme')),
      classifyEvent('africa', item('Cholera outbreak declared')),
      classifyEvent('tunisia', item('one-day strike announced')),
      classifyEvent('tunisia', item('Flash floods submerge roads')),
    ];
    const ordered = sortByCriticality(events).map((event) => event.criticality);
    expect(ordered).toEqual(['critical', 'high', 'medium', 'low']);
  });
});
