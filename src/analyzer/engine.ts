import * as path from 'path';
import * as ts from 'typescript';
import { DETECTION_CATALOG, DetectionCatalogEntry } from './catalog';
import {
    BaselineFeature,
    BaselineFinding,
    BaselineOpportunity,
    BaselineReport,
    BaselineReportSummary,
    FileAnalysisReport,
    FeatureInventoryEntry,
    ProjectConfiguration,
    ResolvedTargets,
    SourceDocument,
    SourceLanguage,
    SourceRange
} from '../core/types';

export interface AnalyzerContext {
    configuration: ProjectConfiguration;
    resolvedTargets: ResolvedTargets;
    getFeature(featureId: string): BaselineFeature | undefined;
    getAllFeatures(): BaselineFeature[];
    dataVersion: string;
}

interface DetectionHit {
    entry: DetectionCatalogEntry;
    feature: BaselineFeature;
    range: SourceRange;
    excerpt: string;
}

const BROWSER_FALLBACKS: Record<string, string[]> = {
    chrome_android: ['chrome'],
    firefox_android: ['firefox'],
    safari_ios: ['safari']
};

function createRangeFromOffsets(content: string, startOffset: number, endOffset: number): SourceRange {
    const start = offsetToPosition(content, startOffset);
    const end = offsetToPosition(content, endOffset);

    return {
        start: { ...start, offset: startOffset },
        end: { ...end, offset: endOffset }
    };
}

function offsetToPosition(content: string, offset: number): { line: number; character: number } {
    const before = content.slice(0, offset);
    const lines = before.split('\n');

    return {
        line: lines.length - 1,
        character: lines[lines.length - 1]?.length ?? 0
    };
}

function excerptForRange(content: string, range: SourceRange): string {
    return content.slice(range.start.offset, range.end.offset).trim() || content.split('\n')[range.start.line]?.trim() || '';
}

function parseVersion(version: string): number[] | undefined {
    const normalized = version.replace(/[^\d.]/g, '').trim();
    if (!normalized) {
        return undefined;
    }

    return normalized.split('.').map(part => Number(part)).filter(part => !Number.isNaN(part));
}

function compareVersions(left: string, right: string): number {
    const leftParts = parseVersion(left);
    const rightParts = parseVersion(right);

    if (!leftParts || !rightParts) {
        return 0;
    }

    const maxLength = Math.max(leftParts.length, rightParts.length);
    for (let index = 0; index < maxLength; index += 1) {
        const leftPart = leftParts[index] ?? 0;
        const rightPart = rightParts[index] ?? 0;

        if (leftPart < rightPart) {
            return -1;
        }

        if (leftPart > rightPart) {
            return 1;
        }
    }

    return 0;
}

function resolveSupportVersion(feature: BaselineFeature, browser: string): string | undefined {
    const directSupport = feature.support[browser as keyof typeof feature.support];
    if (directSupport) {
        return directSupport;
    }

    const fallbacks = BROWSER_FALLBACKS[browser] ?? [];
    for (const fallback of fallbacks) {
        const fallbackSupport = feature.support[fallback as keyof typeof feature.support];
        if (fallbackSupport) {
            return fallbackSupport;
        }
    }

    return undefined;
}

function evaluateFeature(feature: BaselineFeature, targets: ResolvedTargets, configuration: ProjectConfiguration): {
    unsupportedBrowsers: string[];
    severity: 'error' | 'warning' | 'info' | null;
} {
    const unsupportedBrowsers = targets.browsers
        .filter(target => {
            const supportVersion = resolveSupportVersion(feature, target.browser);
            if (!supportVersion) {
                return true;
            }

            return compareVersions(supportVersion, target.version) > 0;
        })
        .map(target => `${target.browser} ${target.version}`);

    if (unsupportedBrowsers.length === 0) {
        return {
            unsupportedBrowsers,
            severity: null
        };
    }

    if (feature.discouraged || feature.status === 'limited') {
        return {
            unsupportedBrowsers,
            severity: 'error'
        };
    }

    if (feature.status === 'newly') {
        return {
            unsupportedBrowsers,
            severity: configuration.warningLevel === 'error' ? 'error' : 'warning'
        };
    }

    return {
        unsupportedBrowsers,
        severity: configuration.warningLevel === 'error'
            ? 'error'
            : configuration.warningLevel === 'warning'
                ? 'warning'
                : 'info'
    };
}

function findTextDetections(document: SourceDocument, context: AnalyzerContext): DetectionHit[] {
    const hits: DetectionHit[] = [];
    const catalogEntries = DETECTION_CATALOG.filter(entry => entry.languages.includes(document.language) && entry.patterns);

    for (const entry of catalogEntries) {
        const feature = context.getFeature(entry.featureId);
        if (!feature || !entry.patterns) {
            continue;
        }

        for (const pattern of entry.patterns) {
            const regex = new RegExp(pattern.source, pattern.flags);
            let match: RegExpExecArray | null;

            while ((match = regex.exec(document.content)) !== null) {
                const startOffset = match.index;
                const endOffset = match.index + match[0].length;
                const range = createRangeFromOffsets(document.content, startOffset, endOffset);

                hits.push({
                    entry,
                    feature,
                    range,
                    excerpt: excerptForRange(document.content, range)
                });
            }
        }
    }

    return hits;
}

function walkAst(node: ts.Node, visit: (node: ts.Node) => void): void {
    visit(node);
    node.forEachChild(child => walkAst(child, visit));
}

function astMatchRange(node: ts.Node, sourceFile: ts.SourceFile, content: string): SourceRange {
    const startOffset = node.getStart(sourceFile);
    const endOffset = node.getEnd();
    return createRangeFromOffsets(content, startOffset, endOffset);
}

function findAstDetections(document: SourceDocument, context: AnalyzerContext): DetectionHit[] {
    if (document.language !== 'javascript' && document.language !== 'typescript') {
        return [];
    }

    const hits: DetectionHit[] = [];
    const scriptKind = document.language === 'typescript' ? ts.ScriptKind.TS : ts.ScriptKind.JS;
    const sourceFile = ts.createSourceFile(document.filePath, document.content, ts.ScriptTarget.Latest, true, scriptKind);
    const catalogEntries = DETECTION_CATALOG.filter(entry => entry.languages.includes(document.language) && entry.astMatcher);

    walkAst(sourceFile, node => {
        for (const entry of catalogEntries) {
            const feature = context.getFeature(entry.featureId);
            if (!feature || !entry.astMatcher || !entry.astMatcher(node, sourceFile)) {
                continue;
            }

            const range = astMatchRange(node, sourceFile, document.content);
            hits.push({
                entry,
                feature,
                range,
                excerpt: excerptForRange(document.content, range)
            });
        }
    });

    return hits;
}

function dedupeDetections(hits: DetectionHit[]): DetectionHit[] {
    const seen = new Set<string>();

    return hits
        .slice()
        .sort((left, right) => {
            const offsetDelta = left.range.start.offset - right.range.start.offset;
            if (offsetDelta !== 0) {
                return offsetDelta;
            }

            return (right.range.end.offset - right.range.start.offset) - (left.range.end.offset - left.range.start.offset);
        })
        .filter((hit, index, collection) => {
            const key = `${hit.feature.canonicalId}:${hit.range.start.offset}:${hit.range.end.offset}`;
            if (seen.has(key)) {
                return false;
            }

            const nestedInSameFeature = collection.some((candidate, candidateIndex) => {
                if (candidateIndex === index || candidate.feature.canonicalId !== hit.feature.canonicalId) {
                    return false;
                }

                return candidate.range.start.offset <= hit.range.start.offset &&
                    candidate.range.end.offset >= hit.range.end.offset &&
                    (
                        candidate.range.start.offset < hit.range.start.offset ||
                        candidate.range.end.offset > hit.range.end.offset
                    );
            });

            if (nestedInSameFeature) {
                return false;
            }

            seen.add(key);
            return true;
        });
}

function findingId(relativePath: string, hit: DetectionHit): string {
    return `${relativePath}:${hit.feature.canonicalId}:${hit.range.start.line + 1}:${hit.range.start.character + 1}`;
}

function toFinding(document: SourceDocument, hit: DetectionHit, context: AnalyzerContext): BaselineFinding | undefined {
    const evaluation = evaluateFeature(hit.feature, context.resolvedTargets, context.configuration);
    if (!evaluation.severity) {
        return undefined;
    }

    return {
        id: findingId(document.relativePath, hit),
        featureId: hit.feature.id,
        canonicalFeatureId: hit.feature.canonicalId,
        feature: hit.feature,
        filePath: document.filePath,
        relativePath: document.relativePath,
        language: document.language,
        severity: evaluation.severity,
        message: `${hit.feature.name} is not fully covered by the current targets (${context.resolvedTargets.label}).`,
        recommendation: hit.feature.usage_recommendation,
        fallback: hit.feature.progressive_enhancement,
        unsupportedBrowsers: evaluation.unsupportedBrowsers,
        range: hit.range,
        excerpt: hit.excerpt
    };
}

function inventoryFromHits(document: SourceDocument, hits: DetectionHit[]): FeatureInventoryEntry[] {
    const inventory = new Map<string, FeatureInventoryEntry>();

    for (const hit of hits) {
        const key = hit.feature.canonicalId;
        const current = inventory.get(key);

        if (current) {
            current.occurrences += 1;
            if (!current.files.includes(document.relativePath)) {
                current.files.push(document.relativePath);
            }
            continue;
        }

        inventory.set(key, {
            featureId: hit.feature.id,
            canonicalFeatureId: hit.feature.canonicalId,
            feature: hit.feature,
            occurrences: 1,
            files: [document.relativePath]
        });
    }

    return Array.from(inventory.values()).sort((left, right) => right.occurrences - left.occurrences);
}

function riskScore(findings: BaselineFinding[]): number {
    return findings.reduce((score, finding) => {
        switch (finding.severity) {
            case 'error':
                return score + 3;
            case 'warning':
                return score + 2;
            case 'info':
            default:
                return score + 1;
        }
    }, 0);
}

export function analyzeDocument(document: SourceDocument, context: AnalyzerContext): FileAnalysisReport {
    const detections = dedupeDetections([
        ...findTextDetections(document, context),
        ...findAstDetections(document, context)
    ]);

    const findings = detections
        .map(hit => toFinding(document, hit, context))
        .filter((finding): finding is BaselineFinding => Boolean(finding));

    return {
        filePath: document.filePath,
        relativePath: document.relativePath,
        language: document.language,
        findings,
        inventory: inventoryFromHits(document, detections),
        riskScore: riskScore(findings)
    };
}

function summarize(files: FileAnalysisReport[]): BaselineReportSummary {
    const findings = files.flatMap(file => file.findings);

    return {
        totalFiles: files.length,
        totalFindings: findings.length,
        errorCount: findings.filter(finding => finding.severity === 'error').length,
        warningCount: findings.filter(finding => finding.severity === 'warning').length,
        infoCount: findings.filter(finding => finding.severity === 'info').length,
        topRiskFiles: files
            .filter(file => file.riskScore > 0)
            .sort((left, right) => right.riskScore - left.riskScore)
            .slice(0, 5)
            .map(file => ({
                relativePath: file.relativePath,
                riskScore: file.riskScore,
                findingCount: file.findings.length
            }))
    };
}

function buildOpportunities(files: FileAnalysisReport[], context: AnalyzerContext): BaselineOpportunity[] {
    const usedFeatures = new Set(files.flatMap(file => file.inventory.map(entry => entry.canonicalFeatureId)));

    return context.getAllFeatures()
        .filter(feature => !usedFeatures.has(feature.canonicalId))
        .filter(feature => evaluateFeature(feature, context.resolvedTargets, context.configuration).severity === null)
        .filter(feature => feature.status !== 'limited')
        .slice(0, 8)
        .map(feature => ({
            featureId: feature.id,
            canonicalFeatureId: feature.canonicalId,
            feature,
            reason: `${feature.name} is compatible with the current targets (${context.resolvedTargets.label}) and is not yet used in this workspace.`
        }));
}

export function buildBaselineReport(documents: SourceDocument[], context: AnalyzerContext): BaselineReport {
    const files = documents
        .map(document => analyzeDocument(document, context))
        .sort((left, right) => left.relativePath.localeCompare(right.relativePath));

    return {
        generatedAt: new Date().toISOString(),
        dataVersion: context.dataVersion,
        targets: context.resolvedTargets,
        summary: summarize(files),
        files,
        findings: files.flatMap(file => file.findings),
        opportunities: buildOpportunities(files, context)
    };
}

export function languageFromFilePath(filePath: string): SourceLanguage | undefined {
    const extension = path.extname(filePath).toLowerCase();

    switch (extension) {
        case '.html':
        case '.htm':
            return 'html';
        case '.css':
            return 'css';
        case '.js':
        case '.mjs':
            return 'javascript';
        case '.ts':
        case '.tsx':
            return 'typescript';
        default:
            return undefined;
    }
}
