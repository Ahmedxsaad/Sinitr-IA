/**
 * Typed configuration for every service. The environment is read and validated
 * exactly once, here. Other packages and services receive config from this
 * module and never touch `process.env` themselves.
 */
import { z } from 'zod';

/** Parse the strings "true" / "false" (and real booleans) into a boolean. */
const booleanFromString = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return value;
}, z.boolean());

/**
 * The full set of environment variables the system understands, with safe local
 * defaults so the stack boots without a .env file during development.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

    // Demo mode uses deterministic mock adapters and seeded data. Keep it on until
    // real providers are wired, and use it to guarantee an offline-safe demo.
    DEMO_MODE: booleanFromString.default(true),
    // Temporary deployment guard for adjuster actions until an identity provider
    // is integrated. It is required whenever demo mode is disabled.
    ADJUSTER_TOKEN: z.string().min(16).optional(),

    GATEWAY_PORT: z.coerce.number().int().positive().default(4000),
    INTAKE_PORT: z.coerce.number().int().positive().default(4001),
    EVIDENCE_PORT: z.coerce.number().int().positive().default(4002),
    CLAIMS_PORT: z.coerce.number().int().positive().default(4003),
    GRAPH_PORT: z.coerce.number().int().positive().default(4004),
    NOTIFY_PORT: z.coerce.number().int().positive().default(4005),
    // Standalone situational-awareness feed. Additive: not part of the claim
    // pipeline, so the gateway reaches it directly rather than through the
    // ServiceClients interface.
    SIGNALS_PORT: z.coerce.number().int().positive().default(4006),

    INTAKE_URL: z.string().url().default('http://localhost:4001'),
    EVIDENCE_URL: z.string().url().default('http://localhost:4002'),
    CLAIMS_URL: z.string().url().default('http://localhost:4003'),
    GRAPH_URL: z.string().url().default('http://localhost:4004'),
    NOTIFY_URL: z.string().url().default('http://localhost:4005'),
    SIGNALS_URL: z.string().url().default('http://localhost:4006'),
  })
  .superRefine((value, context) => {
    if (!value.DEMO_MODE && !value.ADJUSTER_TOKEN) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ADJUSTER_TOKEN'],
        message: 'ADJUSTER_TOKEN is required when DEMO_MODE is false',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/** Cached parsed config, so validation runs once per process. */
let cached: Env | null = null;

/**
 * Parse and validate the environment, caching the result. Throws a readable
 * error listing the offending variables if validation fails.
 */
export function getConfig(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Base URLs the gateway uses to reach each internal service. */
export function getServiceUrls(): Record<
  'intake' | 'evidence' | 'claims' | 'graph' | 'notify',
  string
> {
  const env = getConfig();
  return {
    intake: env.INTAKE_URL,
    evidence: env.EVIDENCE_URL,
    claims: env.CLAIMS_URL,
    graph: env.GRAPH_URL,
    notify: env.NOTIFY_URL,
  };
}

/**
 * Shared decision thresholds. Centralized so tuning happens in one place rather
 * than as magic numbers scattered across services.
 */
export const THRESHOLDS = {
  /** Minimum evidence completeness (0 to 100) for a fast-track recommendation. */
  fastTrackMinCompleteness: 90,
  /** Minimum overall confidence score (0 to 1) for a fast-track recommendation. */
  fastTrackMinConfidenceScore: 0.75,
  /** Below this overall confidence score, a claim cannot be fast-tracked. */
  lowConfidenceScore: 0.5,
} as const;
