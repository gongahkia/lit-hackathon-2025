export type BaselineStatus = 'limited' | 'newly' | 'widely';

export type WarningLevel = 'error' | 'warning' | 'info';

export type TargetMode = 'custom-browser-support' | 'baseline-widely' | 'baseline-year';

export type SupportedBrowser =
    | 'chrome'
    | 'chrome_android'
    | 'edge'
    | 'firefox'
    | 'firefox_android'
    | 'safari'
    | 'safari_ios';

export interface BaselineSupportMap {
    chrome?: string;
    chrome_android?: string;
    edge?: string;
    firefox?: string;
    firefox_android?: string;
    safari?: string;
    safari_ios?: string;
}

export interface BaselineFeature {
    id: string;
    canonicalId: string;
    name: string;
    description: string;
    status: BaselineStatus;
    baseline: {
        high?: string;
        low?: string;
    };
    support: BaselineSupportMap;
    mdn_url?: string;
    spec_url?: string;
    spec_urls?: string[];
    caniuse_id?: string;
    caniuse_ids?: string[];
    compat_features?: string[];
    discouraged?: {
        reason: string;
        according_to?: string[];
        alternatives?: string[];
        removal_date?: string;
    };
    usage_recommendation?: string;
    progressive_enhancement?: string;
}

export interface FeatureUsage {
    feature: BaselineFeature;
    occurrences: number;
    files: string[];
    firstOccurrence: {
        file: string;
        line: number;
        character: number;
    };
}

export interface ProjectConfiguration {
    browserSupport: string[];
    warningLevel: WarningLevel;
    autoCheck: boolean;
    cacheDuration: number;
    excludePatterns: string[];
    targetMode: TargetMode;
    baselineYear?: number;
    widelyAvailableOnDate?: string;
    includeDownstreamBrowsers: boolean;
    customFeatures?: BaselineFeature[];
    teamSettings?: {
        notifyOnNewFeatures?: boolean;
        requireApprovalForLimited?: boolean;
        autoUpdateBaseline?: boolean;
    };
}

export interface ResolvedBrowserTarget {
    browser: SupportedBrowser | string;
    version: string;
    release_date?: string;
}

export interface ResolvedTargets {
    mode: TargetMode;
    label: string;
    browsers: ResolvedBrowserTarget[];
    browserMap: Record<string, string>;
}

export type SourceLanguage = 'html' | 'css' | 'javascript' | 'typescript';

export interface SourceDocument {
    filePath: string;
    relativePath: string;
    language: SourceLanguage;
    content: string;
}

export interface SourceRange {
    start: {
        line: number;
        character: number;
        offset: number;
    };
    end: {
        line: number;
        character: number;
        offset: number;
    };
}

export interface BaselineFinding {
    id: string;
    featureId: string;
    canonicalFeatureId: string;
    feature: BaselineFeature;
    filePath: string;
    relativePath: string;
    language: SourceLanguage;
    severity: 'error' | 'warning' | 'info';
    message: string;
    recommendation?: string;
    fallback?: string;
    unsupportedBrowsers: string[];
    range: SourceRange;
    excerpt: string;
}

export interface FeatureInventoryEntry {
    featureId: string;
    canonicalFeatureId: string;
    feature: BaselineFeature;
    occurrences: number;
    files: string[];
}

export interface FileAnalysisReport {
    filePath: string;
    relativePath: string;
    language: SourceLanguage;
    findings: BaselineFinding[];
    inventory: FeatureInventoryEntry[];
    riskScore: number;
}

export interface BaselineOpportunity {
    featureId: string;
    canonicalFeatureId: string;
    feature: BaselineFeature;
    reason: string;
}

export interface BaselineReportSummary {
    totalFiles: number;
    totalFindings: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    topRiskFiles: Array<{
        relativePath: string;
        riskScore: number;
        findingCount: number;
    }>;
}

export interface BaselineReport {
    generatedAt: string;
    dataVersion: string;
    targets: ResolvedTargets;
    summary: BaselineReportSummary;
    files: FileAnalysisReport[];
    findings: BaselineFinding[];
    opportunities: BaselineOpportunity[];
}

export interface CompatibilityIssue {
    feature: BaselineFeature;
    severity: 'error' | 'warning' | 'info';
    message: string;
    range: {
        start: { line: number; character: number };
        end: { line: number; character: number };
    };
    suggestions?: string[];
    code?: string;
}

export interface BaselineData {
    features: Map<string, BaselineFeature>;
    featuresByCanonicalId: Map<string, BaselineFeature>;
    lastUpdated: Date;
    version: string;
}

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}
