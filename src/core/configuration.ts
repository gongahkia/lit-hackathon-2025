import * as fs from 'fs';
import * as path from 'path';
import { getCompatibleVersions } from 'baseline-browser-mapping';
import { minimatch } from 'minimatch';
import { ProjectConfiguration, ResolvedTargets, SupportedBrowser, TargetMode } from './types';

type PartialConfiguration = Partial<ProjectConfiguration>;

const DEFAULT_CONFIGURATION: ProjectConfiguration = {
    browserSupport: ['chrome 90', 'firefox 88', 'safari 14', 'edge 90'],
    warningLevel: 'warning',
    autoCheck: true,
    cacheDuration: 3600,
    excludePatterns: ['node_modules/**', 'dist/**', 'build/**', 'out/**', 'build-tools/**', '.git/**', '**/*.min.js', '**/*.min.css'],
    targetMode: 'custom-browser-support',
    baselineYear: undefined,
    widelyAvailableOnDate: undefined,
    includeDownstreamBrowsers: false,
    customFeatures: [],
    teamSettings: {
        notifyOnNewFeatures: true,
        requireApprovalForLimited: true,
        autoUpdateBaseline: true
    }
};

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
    if (!Array.isArray(value)) {
        return fallback;
    }

    return value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean);
}

function normalizeTargetMode(value: unknown): TargetMode {
    if (value === 'baseline-year' || value === 'baseline-widely' || value === 'custom-browser-support') {
        return value;
    }

    return DEFAULT_CONFIGURATION.targetMode;
}

function resolveConfigurationPath(workspaceRoot?: string): string | undefined {
    if (!workspaceRoot) {
        return undefined;
    }

    const configPath = path.join(workspaceRoot, '.baseline-config.json');
    return fs.existsSync(configPath) ? configPath : undefined;
}

export function readConfigurationFile(workspaceRoot?: string): PartialConfiguration {
    const configPath = resolveConfigurationPath(workspaceRoot);
    if (!configPath) {
        return {};
    }

    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8')) as PartialConfiguration;
    } catch {
        return {};
    }
}

export function mergeProjectConfiguration(...sources: Array<PartialConfiguration | undefined>): ProjectConfiguration {
    const merged = sources.reduce<PartialConfiguration>((accumulator, current) => {
        if (!current) {
            return accumulator;
        }

        return {
            ...accumulator,
            ...current,
            teamSettings: {
                ...(accumulator.teamSettings ?? {}),
                ...(current.teamSettings ?? {})
            }
        };
    }, {});

    return {
        browserSupport: normalizeStringArray(merged.browserSupport, DEFAULT_CONFIGURATION.browserSupport),
        warningLevel: merged.warningLevel === 'error' || merged.warningLevel === 'warning' || merged.warningLevel === 'info'
            ? merged.warningLevel
            : DEFAULT_CONFIGURATION.warningLevel,
        autoCheck: typeof merged.autoCheck === 'boolean' ? merged.autoCheck : DEFAULT_CONFIGURATION.autoCheck,
        cacheDuration: typeof merged.cacheDuration === 'number' ? merged.cacheDuration : DEFAULT_CONFIGURATION.cacheDuration,
        excludePatterns: normalizeStringArray(merged.excludePatterns, DEFAULT_CONFIGURATION.excludePatterns),
        targetMode: normalizeTargetMode(merged.targetMode),
        baselineYear: typeof merged.baselineYear === 'number' ? merged.baselineYear : undefined,
        widelyAvailableOnDate: typeof merged.widelyAvailableOnDate === 'string' ? merged.widelyAvailableOnDate : undefined,
        includeDownstreamBrowsers: typeof merged.includeDownstreamBrowsers === 'boolean'
            ? merged.includeDownstreamBrowsers
            : DEFAULT_CONFIGURATION.includeDownstreamBrowsers,
        customFeatures: merged.customFeatures ?? [],
        teamSettings: {
            ...DEFAULT_CONFIGURATION.teamSettings,
            ...(merged.teamSettings ?? {})
        }
    };
}

function parseBrowserSupportEntry(entry: string): { browser: string; version: string } | undefined {
    const trimmed = entry.trim();
    if (!trimmed) {
        return undefined;
    }

    const [browser, ...rest] = trimmed.split(/\s+/);
    const version = rest.join(' ').trim();

    if (!browser || !version) {
        return undefined;
    }

    return {
        browser: browser.toLowerCase(),
        version
    };
}

export function resolveTargets(configuration: ProjectConfiguration): ResolvedTargets {
    if (configuration.targetMode === 'baseline-year' && configuration.baselineYear) {
        const browsers = getCompatibleVersions({
            targetYear: configuration.baselineYear,
            includeDownstreamBrowsers: configuration.includeDownstreamBrowsers,
            suppressWarnings: true
        });

        return {
            mode: 'baseline-year',
            label: `Baseline year ${configuration.baselineYear}`,
            browsers,
            browserMap: Object.fromEntries(browsers.map(entry => [entry.browser, entry.version]))
        };
    }

    if (configuration.targetMode === 'baseline-widely') {
        const browsers = getCompatibleVersions({
            widelyAvailableOnDate: configuration.widelyAvailableOnDate,
            includeDownstreamBrowsers: configuration.includeDownstreamBrowsers,
            suppressWarnings: true
        });

        return {
            mode: 'baseline-widely',
            label: configuration.widelyAvailableOnDate
                ? `Baseline widely available on ${configuration.widelyAvailableOnDate}`
                : 'Current Baseline widely available',
            browsers,
            browserMap: Object.fromEntries(browsers.map(entry => [entry.browser, entry.version]))
        };
    }

    const browsers = configuration.browserSupport
        .map(parseBrowserSupportEntry)
        .filter((value): value is { browser: string; version: string } => Boolean(value))
        .map(entry => ({
            browser: entry.browser as SupportedBrowser,
            version: entry.version
        }));

    return {
        mode: 'custom-browser-support',
        label: browsers.length > 0 ? `Custom browsers: ${configuration.browserSupport.join(', ')}` : 'Custom browsers',
        browsers,
        browserMap: Object.fromEntries(browsers.map(entry => [entry.browser, entry.version]))
    };
}

export function isExcludedPath(filePath: string, workspaceRoot: string | undefined, excludePatterns: string[]): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const relativePath = workspaceRoot
        ? path.relative(workspaceRoot, filePath).replace(/\\/g, '/')
        : normalizedPath;

    return excludePatterns.some(pattern =>
        minimatch(relativePath, pattern, { dot: true }) ||
        minimatch(normalizedPath, pattern, { dot: true })
    );
}
