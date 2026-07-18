# Sinistr'IA - Concept note

An updated concept note for reviewers who want the business case alongside
the technical one. Market figures are sourced inline. The Business Model
Canvas is a working draft: a pilot validates pricing and channel choices,
this is not a committed price list.

## 1. Problem

Motor is the largest line in Tunisia's insurance market: 1.628 billion TND
in premiums in 2025, 38.3% of the total market, growing 7.4% year on year
([Atlas Mag, 2025 figures](https://www.atlas-mag.net/en/articles/tunisian-insurance-market-2025-figures)).
Claims are growing faster than premiums: in Q1 2026, claims paid rose 18.4%
year on year against 10.5% turnover growth
([Atlas Mag, Q1 2026 results](https://www.atlas-mag.net/en/articles/tunisian-insurance-market-results-end-march-2026)),
a margin squeeze insurers absorb directly. Motor third-party liability has
carried loss ratios above 100% with material fraud exposure
([academia.edu, AI in Tunisian insurance](https://www.academia.edu/164465572/How_Artificial_Intelligence_can_transform_Insurance_in_Tunisia_Optimizing_Underwriting_Enhancing_Claims_Management_and_Strengthening_Fraud_Detection)).

The first ten minutes after a crash are the least documented part of the
whole claims lifecycle. What a driver says, photographs, or writes on a
constat is inconsistent and slow for an adjuster to reconstruct by hand,
in a market that runs on Derja first, not the French or English most
claims software assumes.

## 2. Solution

Sinistr'IA is a Derja-first AI accident witness. In the first minutes after
a motor accident it guides the driver through voice, guided photo, and
document capture, then converts everything into one explainable, auditable
Accident Evidence Twin. An adjuster reviews the Twin and owns the decision;
the machine never pays a claim. See [plan.md](plan.md) for scope and
[architecture.md](architecture.md) for how the pipeline is built.

## 3. Market opportunity

**Tunisia, 2025 to date** (source:
[Atlas Mag](https://www.atlas-mag.net/en/articles/tunisian-insurance-market-2025-figures),
[Atlas Mag Q1 2026](https://www.atlas-mag.net/en/articles/tunisian-insurance-market-results-end-march-2026)):

| Metric                        | 2025            | Q1 2026          |
| ------------------------------ | --------------- | ----------------- |
| Total insurance turnover       | 4.255 bn TND (+11.4%) | 1.401 bn TND (+10.5%) |
| Non-life premiums              | 2.919 bn TND (+9.3%)  | -                  |
| Motor premiums                 | 1.628 bn TND (+7.4%), 38.3% of market | -    |
| Claims paid                    | 2.363 bn TND (+6.1%)  | 585.4 M TND (+18.4%) |

**What AI-driven claims automation delivers elsewhere** (external industry
benchmarks, not a Sinistr'IA measured result): processing time down 50 to
70%, operating cost down up to 40%
([RaftLabs](https://www.raftlabs.com/blog/ai-claims-processing)), loss
adjusting expense down 20 to 25% with claims leakage down 30 to 50%
([Bain & Company](https://www.bain.com/insights/100-billion-dollar-opportunity-for-generative-ai-in-p-and-c-claims-handling/)).

**Regional signal.** Investors are actively funding this category: Amenli
in Egypt, the first licensed online insurance broker, issues a policy in
under 10 minutes against a 3-week industry norm; FurtherAI raised a $25M
Series A and Avallon Labs a $4.6M seed, both for AI claims automation
([fintech.global](https://fintech.global/2026/05/14/insurtech-firm-insured-io-launches-ai-claims-agent/),
[insnerds.com](https://insnerds.com/news/ai-claims-automation-insurtech-avallon-secures-4-6-million-seed-funding)).

## 4. Business Model Canvas

| Block                     | Content                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Customer segments           | Motor insurers and mutuelles operating in Tunisia, CGA-supervised carriers first; MENA expansion afterward. |
| Value propositions          | Insurer: faster, consistent triage, an explainable evidence twin grounded in the policy, an earlier fraud signal. Driver: a guided Derja flow built for the shock of the first ten minutes. Adjuster: one screen with the story, the evidence, and the policy match instead of stitching calls, photos, and paper constats by hand. |
| Channels                    | Direct sales to insurer claims and operations departments, pilot partnerships, presence at insurance and insurtech industry events. |
| Customer relationships      | Pilot then scale: a proof of concept on a limited, low-severity segment before wider rollout, dedicated onboarding, adjuster training. |
| Revenue streams             | Per-claim processed fee or a volume-tiered SaaS license to the insurer; an optional add-on for the relationship graph and fraud module. |
| Key resources               | The Accident Evidence Twin contract and pipeline, hosted AI adapters (speech, vision, language) behind a stable interface, the shared design system, workstream expertise across voice intake, multimodal evidence, and claims logic. |
| Key activities              | Pipeline accuracy and safety-gate tuning, policy clause coverage expansion, integration with insurer core systems, audit trail and compliance maintenance. |
| Key partnerships            | Pilot insurers and mutuelles, hosted AI providers for speech, vision, and language, garage or expertise networks for damage-cost grounding, CGA-facing compliance guidance. |
| Cost structure              | Hosted AI API usage (variable, scales with claim volume), engineering by workstream, compliance and security review, sales and onboarding per pilot. |

## 5. Path to revenue

- **Now.** A working vertical slice: two scripted hero cases plus eight
  gate and scoring cases, both apps, six services, verified end to end. See
  [data-room.md](data-room.md).
- **Next.** A pilot with one insurer on the current build's scope: low
  severity, property damage only, clear coverage (see
  [plan.md](plan.md) section 2). Pricing and integration terms are set with
  that pilot partner, not assumed in advance.
- **Then.** Expand coverage (bodily injury, disputed liability) only once
  escalation and human-review controls are proven at pilot scale, per the
  product guardrails in [../CLAUDE.md](../CLAUDE.md): no autonomous payout,
  every recommendation shows its evidence, injury or low confidence always
  escalates to a human.

## 6. Team

Ownership is organized by workstream, not individual, so the mapping
survives team changes; see [plan.md](plan.md) section 4 for the full table:
mobile and live journey, cockpit and visual story, integration, voice and
intake, multimodal intelligence, and claims logic.
