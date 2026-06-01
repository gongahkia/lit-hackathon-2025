import * as fs from 'fs';
import * as path from 'path';
import { buildBaselineReport, languageFromFilePath } from '../analyzer/engine';
import { isExcludedPath, mergeProjectConfiguration, readConfigurationFile, resolveTargets } from '../core/configuration';
import { loadBaselineData } from '../core/featureRegistry';
import { BaselineReport, ProjectConfiguration, SourceDocument } from '../core/types';

export interface WorkspaceScanOptions {
    cwd?: string;
    configuration?: Partial<ProjectConfiguration>;
}

export interface VirtualSourceInput {
    filePath: string;
    content: string;
}

const DEFAULT_SCAN_ROOT = process.cwd();

function walkDirectory(rootPath: string): string[] {
    const entries = fs.readdirSync(rootPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(rootPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkDirectory(fullPath));
            continue;
        }

        files.push(fullPath);
    }

    return files;
}

function createContext(options: WorkspaceScanOptions) {
    const cwd = options.cwd ?? DEFAULT_SCAN_ROOT;
    const configuration = mergeProjectConfiguration(
        readConfigurationFile(cwd),
        options.configuration
    );
    const data = loadBaselineData();

    return {
        cwd,
        configuration,
        resolvedTargets: resolveTargets(configuration),
        data,
        analyzerContext: {
            configuration,
            resolvedTargets: resolveTargets(configuration),
            getFeature: (featureId: string) => data.features.get(featureId),
            getAllFeatures: () => Array.from(data.featuresByCanonicalId.values()),
            dataVersion: data.version
        }
    };
}

function toSourceDocument(filePath: string, content: string, cwd: string): SourceDocument | undefined {
    const language = languageFromFilePath(filePath);
    if (!language) {
        return undefined;
    }

    return {
        filePath,
        relativePath: path.relative(cwd, filePath).replace(/\\/g, '/'),
        language,
        content
    };
}

export function scanWorkspaceFromSources(sources: VirtualSourceInput[], options: WorkspaceScanOptions = {}): BaselineReport {
    const context = createContext(options);
    const documents = sources
        .filter(source => !isExcludedPath(source.filePath, context.cwd, context.configuration.excludePatterns))
        .map(source => toSourceDocument(source.filePath, source.content, context.cwd))
        .filter((document): document is SourceDocument => Boolean(document));

    return buildBaselineReport(documents, context.analyzerContext);
}

export function scanWorkspaceFromFileSystem(options: WorkspaceScanOptions = {}): BaselineReport {
    const context = createContext(options);
    const sources = walkDirectory(context.cwd)
        .filter(filePath => !isExcludedPath(filePath, context.cwd, context.configuration.excludePatterns))
        .map(filePath => {
            try {
                return {
                    filePath,
                    content: fs.readFileSync(filePath, 'utf8')
                };
            } catch {
                return undefined;
            }
        })
        .filter((source): source is VirtualSourceInput => Boolean(source));

    return scanWorkspaceFromSources(sources, {
        cwd: context.cwd,
        configuration: context.configuration
    });
}

export function formatMarkdownSummary(report: BaselineReport): string {
    const lines = [
        '## GroundWork Compatibility Report',
        '',
        `- Targets: ${report.targets.label}`,
        `- Files scanned: ${report.summary.totalFiles}`,
        `- Findings: ${report.summary.totalFindings}`,
        `- Errors: ${report.summary.errorCount}`,
        `- Warnings: ${report.summary.warningCount}`,
        `- Info: ${report.summary.infoCount}`,
        ''
    ];

    if (report.summary.topRiskFiles.length > 0) {
        lines.push('### Top Risk Files', '');
        for (const file of report.summary.topRiskFiles) {
            lines.push(`- \`${file.relativePath}\`: ${file.findingCount} findings, risk score ${file.riskScore}`);
        }
        lines.push('');
    }

    if (report.findings.length > 0) {
        lines.push('### Findings', '');
        for (const finding of report.findings.slice(0, 20)) {
            lines.push(`- \`${finding.relativePath}:${finding.range.start.line + 1}\` ${finding.feature.name}: ${finding.unsupportedBrowsers.join(', ')}`);
        }
        lines.push('');
    }

    if (report.opportunities.length > 0) {
        lines.push('### Opportunities', '');
        for (const opportunity of report.opportunities.slice(0, 8)) {
            lines.push(`- ${opportunity.feature.name}: ${opportunity.reason}`);
        }
    }

    return lines.join('\n');
}
