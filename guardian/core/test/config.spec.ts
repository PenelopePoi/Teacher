import { ConfigError, ENV_VARS, loadConfig } from '../src/config';

const FULL_BOUNDS = {
    [ENV_VARS.STOPABILITY_MIN]: '0.5',
    [ENV_VARS.AUTHORSHIP_MIN]: '0.5',
    [ENV_VARS.WITHDRAWAL_COST_MAX]: '0.5',
    [ENV_VARS.DRIFT_MAX]: '0.2',
    [ENV_VARS.CONSENT_MAX_AGE_SECONDS]: '60',
    [ENV_VARS.CONSENT_SIGNING_KEY]: 'test-signing-key-1234567890'
};

describe('loadConfig', () => {
    it('loads a calibrated config', () => {
        const c = loadConfig({
            [ENV_VARS.ALPHA_MODE]: 'calibrated',
            [ENV_VARS.ALPHA]: '3',
            ...FULL_BOUNDS
        });
        expect(c.alphaMode).toBe('calibrated');
        if (c.alphaMode === 'calibrated') expect(c.alpha).toBe(3);
    });

    it('loads an uncalibrated config without ALPHA', () => {
        const c = loadConfig({
            [ENV_VARS.ALPHA_MODE]: 'uncalibrated',
            ...FULL_BOUNDS
        });
        expect(c.alphaMode).toBe('uncalibrated');
    });

    it('rejects missing ALPHA_MODE', () => {
        expect(() => loadConfig({ ...FULL_BOUNDS })).toThrow(ConfigError);
    });

    it('rejects α ≤ 1 in calibrated mode', () => {
        expect(() =>
            loadConfig({
                [ENV_VARS.ALPHA_MODE]: 'calibrated',
                [ENV_VARS.ALPHA]: '1',
                ...FULL_BOUNDS
            })
        ).toThrow();
    });

    it('rejects out-of-range bounds', () => {
        expect(() =>
            loadConfig({
                [ENV_VARS.ALPHA_MODE]: 'calibrated',
                [ENV_VARS.ALPHA]: '3',
                ...FULL_BOUNDS,
                [ENV_VARS.DRIFT_MAX]: '2'
            })
        ).toThrow();
    });

    it('rejects a too-short signing key', () => {
        expect(() =>
            loadConfig({
                [ENV_VARS.ALPHA_MODE]: 'calibrated',
                [ENV_VARS.ALPHA]: '3',
                ...FULL_BOUNDS,
                [ENV_VARS.CONSENT_SIGNING_KEY]: 'short'
            })
        ).toThrow();
    });
});
