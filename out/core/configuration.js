"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExcludedPath = exports.resolveTargets = exports.mergeProjectConfiguration = exports.readConfigurationFile = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const baseline_browser_mapping_1 = require("baseline-browser-mapping");
const minimatch_1 = require("minimatch");
const DEFAULT_CONFIGURATION = {
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
function normalizeStringArray(value, fallback) {
    if (!Array.isArray(value)) {
        return fallback;
    }
    return value.filter((item) => typeof item === 'string').map(item => item.trim()).filter(Boolean);
}
function normalizeTargetMode(value) {
    if (value === 'baseline-year' || value === 'baseline-widely' || value === 'custom-browser-support') {
        return value;
    }
    return DEFAULT_CONFIGURATION.targetMode;
}
function resolveConfigurationPath(workspaceRoot) {
    if (!workspaceRoot) {
        return undefined;
    }
    const configPath = path.join(workspaceRoot, '.baseline-config.json');
    return fs.existsSync(configPath) ? configPath : undefined;
}
function readConfigurationFile(workspaceRoot) {
    const configPath = resolveConfigurationPath(workspaceRoot);
    if (!configPath) {
        return {};
    }
    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    catch {
        return {};
    }
}
exports.readConfigurationFile = readConfigurationFile;
function mergeProjectConfiguration(...sources) {
    const merged = sources.reduce((accumulator, current) => {
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
exports.mergeProjectConfiguration = mergeProjectConfiguration;
function parseBrowserSupportEntry(entry) {
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
function resolveTargets(configuration) {
    if (configuration.targetMode === 'baseline-year' && configuration.baselineYear) {
        const browsers = (0, baseline_browser_mapping_1.getCompatibleVersions)({
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
        const browsers = (0, baseline_browser_mapping_1.getCompatibleVersions)({
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
        .filter((value) => Boolean(value))
        .map(entry => ({
        browser: entry.browser,
        version: entry.version
    }));
    return {
        mode: 'custom-browser-support',
        label: browsers.length > 0 ? `Custom browsers: ${configuration.browserSupport.join(', ')}` : 'Custom browsers',
        browsers,
        browserMap: Object.fromEntries(browsers.map(entry => [entry.browser, entry.version]))
    };
}
exports.resolveTargets = resolveTargets;
function isExcludedPath(filePath, workspaceRoot, excludePatterns) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const relativePath = workspaceRoot
        ? path.relative(workspaceRoot, filePath).replace(/\\/g, '/')
        : normalizedPath;
    return excludePatterns.some(pattern => (0, minimatch_1.minimatch)(relativePath, pattern, { dot: true }) ||
        (0, minimatch_1.minimatch)(normalizedPath, pattern, { dot: true }));
}
exports.isExcludedPath = isExcludedPath;
//# sourceMappingURL=configuration.js.map