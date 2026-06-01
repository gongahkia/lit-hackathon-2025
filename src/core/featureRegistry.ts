import * as fs from 'fs';
import * as path from 'path';
import webFeaturesData from 'web-features/data.json';
import { BaselineData, BaselineFeature, BaselineStatus, BaselineSupportMap } from './types';

type RawFeatureRecord =
    | {
        kind: 'feature';
        name: string;
        description: string;
        spec?: string | string[];
        caniuse?: string | string[];
        compat_features?: string[];
        status: {
            baseline?: 'high' | 'low' | false;
            baseline_low_date?: string;
            baseline_high_date?: string;
            support?: BaselineSupportMap;
        };
        discouraged?: {
            reason: string;
            according_to?: string[];
            alternatives?: string[];
            removal_date?: string;
        };
    }
    | {
        kind: 'moved';
        redirect_target: string;
    }
    | {
        kind: 'split';
        redirect_targets: string[];
    };

type FeatureCollection = Record<string, RawFeatureRecord>;
type RawFeatureStatus = Extract<RawFeatureRecord, { kind: 'feature' }>['status'];

const LEGACY_FEATURE_ALIASES: Record<string, string> = {
    'css-grid': 'grid',
    'css-flexbox': 'flexbox',
    'css-custom-properties': 'custom-properties',
    'css-container-queries': 'container-queries',
    'css-subgrid': 'subgrid',
    'css-supports': 'supports',
    'css-prefers-color-scheme': 'prefers-color-scheme',
    'css-prefers-reduced-motion': 'prefers-reduced-motion',
    'css-backdrop-filter': 'backdrop-filter',
    'css-clip-path': 'clip-path',
    'css-mask': 'masking',
    'css-shape-outside': 'shape-outside',
    'css-object-fit': 'object-fit',
    'css-filter': 'filter',
    'css-transform': 'transforms2d',
    'css-transition': 'transitions',
    'css-animation': 'animations-css',
    'html-dialog': 'dialog',
    'html-details': 'details',
    'html-summary': 'details',
    'html-template': 'template',
    'html-slot': 'slot',
    'html-picture': 'picture',
    'html-video': 'video',
    'html-audio': 'audio',
    'html-canvas': 'canvas',
    'html-svg': 'svg',
    'javascript-nullish-coalescing': 'nullish-coalescing',
    'javascript-async-await': 'async-await',
    'javascript-destructuring': 'destructuring',
    'javascript-spread-operator': 'spread',
    'javascript-modules': 'js-modules',
    'javascript-fetch': 'fetch',
    'javascript-promises': 'promise',
};

const MANUAL_FEATURES: Record<string, BaselineFeature> = {
    'javascript-optional-chaining': {
        id: 'javascript-optional-chaining',
        canonicalId: 'javascript-optional-chaining',
        name: 'Optional chaining',
        description: 'Safely access nested values with the ?. operator.',
        status: 'widely',
        baseline: {
            low: '2020-01-27',
            high: '2022-07-15'
        },
        support: {
            chrome: '80',
            chrome_android: '80',
            edge: '80',
            firefox: '74',
            firefox_android: '79',
            safari: '13.1',
            safari_ios: '13.4'
        },
        mdn_url: 'https://developer.mozilla.org/search?q=Optional%20chaining',
        spec_url: 'https://tc39.es/ecma262/#sec-optional-chaining-operator',
        spec_urls: ['https://tc39.es/ecma262/#sec-optional-chaining-operator'],
        caniuse_id: 'mdn-javascript_operators_optional_chaining',
        caniuse_ids: ['mdn-javascript_operators_optional_chaining'],
        usage_recommendation: 'Safe to use for modern browser targets.',
        progressive_enhancement: 'Transpile or avoid the operator when supporting older browsers.'
    }
};

function resolvePackageVersion(packageName: string): string {
    try {
        const entryPath = require.resolve(packageName);
        let current = path.dirname(entryPath);

        while (current !== path.dirname(current)) {
            const candidate = path.join(current, 'package.json');
            if (fs.existsSync(candidate)) {
                const pkg = JSON.parse(fs.readFileSync(candidate, 'utf8')) as { name?: string; version?: string };
                if (pkg.name === packageName && pkg.version) {
                    return pkg.version;
                }
            }

            current = path.dirname(current);
        }
    } catch {
        // Ignore and fall through to "unknown".
    }

    return 'unknown';
}

function mapStatus(status: RawFeatureStatus): BaselineStatus {
    if (status.baseline === 'high') {
        return 'widely';
    }

    if (status.baseline === 'low') {
        return 'newly';
    }

    return 'limited';
}

function toArray(value?: string | string[]): string[] | undefined {
    if (!value) {
        return undefined;
    }

    return Array.isArray(value) ? value : [value];
}

function createUsageRecommendation(status: BaselineStatus, discouragedReason?: string): string {
    if (discouragedReason) {
        return `Avoid adopting this feature in new code: ${discouragedReason}`;
    }

    switch (status) {
        case 'widely':
            return 'Safe to use across modern browsers.';
        case 'newly':
            return 'Good candidate when you can tolerate recent browser requirements.';
        case 'limited':
        default:
            return 'Use only with fallbacks or progressive enhancement.';
    }
}

function createProgressiveEnhancementAdvice(status: BaselineStatus, alternatives?: string[]): string {
    if (status === 'widely') {
        return 'Progressive enhancement is generally optional for modern-targeted projects.';
    }

    if (alternatives && alternatives.length > 0) {
        return `Prefer fallbacks or alternatives such as: ${alternatives.join(', ')}.`;
    }

    return 'Guard usage behind fallbacks, feature detection, or alternate implementations.';
}

function createMdnUrl(name: string, compatFeatures?: string[]): string {
    if (compatFeatures && compatFeatures.length > 0) {
        return `https://developer.mozilla.org/search?q=${encodeURIComponent(compatFeatures[0])}`;
    }

    return `https://developer.mozilla.org/search?q=${encodeURIComponent(name)}`;
}

function normalizeFeature(id: string, record: RawFeatureRecord, featureMap: FeatureCollection): BaselineFeature | undefined {
    if (record.kind === 'moved') {
        return normalizeFeature(record.redirect_target, featureMap[record.redirect_target], featureMap);
    }

    if (record.kind !== 'feature') {
        return undefined;
    }

    const status = mapStatus(record.status);
    const specUrls = toArray(record.spec);
    const caniuseIds = toArray(record.caniuse);
    const discouragedReason = record.discouraged?.reason;

    return {
        id,
        canonicalId: id,
        name: record.name,
        description: record.description,
        status,
        baseline: {
            low: record.status.baseline_low_date,
            high: record.status.baseline_high_date
        },
        support: { ...(record.status.support as BaselineSupportMap) },
        mdn_url: createMdnUrl(record.name, record.compat_features),
        spec_url: specUrls?.[0],
        spec_urls: specUrls,
        caniuse_id: caniuseIds?.[0],
        caniuse_ids: caniuseIds,
        compat_features: record.compat_features,
        discouraged: record.discouraged ? {
            reason: record.discouraged.reason,
            according_to: record.discouraged.according_to,
            alternatives: record.discouraged.alternatives,
            removal_date: record.discouraged.removal_date
        } : undefined,
        usage_recommendation: createUsageRecommendation(status, discouragedReason),
        progressive_enhancement: createProgressiveEnhancementAdvice(status, record.discouraged?.alternatives)
    };
}

export function loadBaselineData(): BaselineData {
    const featureSource = webFeaturesData.features as unknown as FeatureCollection;
    const featureMap = new Map<string, BaselineFeature>();
    const featuresByCanonicalId = new Map<string, BaselineFeature>();

    for (const [id, record] of Object.entries(featureSource)) {
        const normalized = normalizeFeature(id, record, featureSource);
        if (!normalized) {
            continue;
        }

        featureMap.set(id, normalized);
        featuresByCanonicalId.set(normalized.canonicalId, normalized);
    }

    for (const [legacyId, canonicalId] of Object.entries(LEGACY_FEATURE_ALIASES)) {
        const feature = featureMap.get(canonicalId);
        if (feature) {
            featureMap.set(legacyId, {
                ...feature,
                id: legacyId
            });
        }
    }

    for (const [featureId, feature] of Object.entries(MANUAL_FEATURES)) {
        featureMap.set(featureId, feature);
        featuresByCanonicalId.set(feature.canonicalId, feature);
    }

    return {
        features: featureMap,
        featuresByCanonicalId,
        lastUpdated: new Date(),
        version: `web-features@${resolvePackageVersion('web-features')}`
    };
}
