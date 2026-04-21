import { z } from 'zod';
import { AgencyBounds } from './types';

/**
 * Runtime configuration for the guardian. Loaded from env vars with
 * strict schema validation — missing or malformed values fail fast.
 *
 * Per §9.5 of the paper, there is no universal α. If the operator has
 * not calibrated α for their deployment context, they set
 * GUARDIAN_ALPHA_MODE=uncalibrated, and the guardian returns
 * INDETERMINATE for every action rather than accepting a placeholder.
 */

const boundSchema = z.coerce.number().min(0).max(1);

const calibratedSchema = z.object({
    alphaMode: z.literal('calibrated'),
    alpha: z.coerce.number().gt(1),
    agencyBounds: z.object({
        stopabilityMin: boundSchema,
        authorshipMin: boundSchema,
        withdrawalCostMax: boundSchema,
        driftMax: boundSchema
    }),
    consentMaxAgeSeconds: z.coerce.number().int().positive().max(600).default(60),
    consentSigningKey: z.string().min(16)
});

const uncalibratedSchema = z.object({
    alphaMode: z.literal('uncalibrated'),
    agencyBounds: z.object({
        stopabilityMin: boundSchema,
        authorshipMin: boundSchema,
        withdrawalCostMax: boundSchema,
        driftMax: boundSchema
    }),
    consentMaxAgeSeconds: z.coerce.number().int().positive().max(600).default(60),
    consentSigningKey: z.string().min(16)
});

const configSchema = z.discriminatedUnion('alphaMode', [calibratedSchema, uncalibratedSchema]);

export type GuardianConfig = z.infer<typeof configSchema>;

/** Fields each deployment must provide as environment variables. */
export const ENV_VARS = {
    ALPHA_MODE: 'GUARDIAN_ALPHA_MODE',
    ALPHA: 'GUARDIAN_ALPHA',
    STOPABILITY_MIN: 'GUARDIAN_STOPABILITY_MIN',
    AUTHORSHIP_MIN: 'GUARDIAN_AUTHORSHIP_MIN',
    WITHDRAWAL_COST_MAX: 'GUARDIAN_WITHDRAWAL_COST_MAX',
    DRIFT_MAX: 'GUARDIAN_DRIFT_MAX',
    CONSENT_MAX_AGE_SECONDS: 'GUARDIAN_CONSENT_MAX_AGE_SECONDS',
    CONSENT_SIGNING_KEY: 'GUARDIAN_CONSENT_SIGNING_KEY'
} as const;

export class ConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConfigError';
    }
}

/**
 * Load config from a `process.env`-shaped record.
 *
 * Accepts an explicit env record so tests do not depend on process state
 * and the Lambda handler can inject a subset of env.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): GuardianConfig {
    const alphaMode = env[ENV_VARS.ALPHA_MODE];
    if (alphaMode !== 'calibrated' && alphaMode !== 'uncalibrated') {
        throw new ConfigError(
            `${ENV_VARS.ALPHA_MODE} must be 'calibrated' or 'uncalibrated' (got: ${JSON.stringify(alphaMode)})`
        );
    }

    const base = {
        agencyBounds: {
            stopabilityMin: env[ENV_VARS.STOPABILITY_MIN],
            authorshipMin: env[ENV_VARS.AUTHORSHIP_MIN],
            withdrawalCostMax: env[ENV_VARS.WITHDRAWAL_COST_MAX],
            driftMax: env[ENV_VARS.DRIFT_MAX]
        },
        consentMaxAgeSeconds: env[ENV_VARS.CONSENT_MAX_AGE_SECONDS],
        consentSigningKey: env[ENV_VARS.CONSENT_SIGNING_KEY]
    };

    const candidate = alphaMode === 'calibrated'
        ? { alphaMode, alpha: env[ENV_VARS.ALPHA], ...base }
        : { alphaMode, ...base };

    const result = configSchema.safeParse(candidate);
    if (!result.success) {
        throw new ConfigError(`invalid guardian config: ${result.error.message}`);
    }
    return result.data;
}

/** Convenience: agency bounds alone, pulled out of the config. */
export function agencyBoundsFromConfig(config: GuardianConfig): AgencyBounds {
    return config.agencyBounds;
}
