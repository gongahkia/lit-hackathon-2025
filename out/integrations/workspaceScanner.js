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
exports.formatMarkdownSummary = exports.scanWorkspaceFromFileSystem = exports.scanWorkspaceFromSources = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const engine_1 = require("../analyzer/engine");
const configuration_1 = require("../core/configuration");
const featureRegistry_1 = require("../core/featureRegistry");
const DEFAULT_SCAN_ROOT = process.cwd();
function walkDirectory(rootPath) {
    const entries = fs.readdirSync(rootPath, { withFileTypes: true });
    const files = [];
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
function createContext(options) {
    const cwd = options.cwd ?? DEFAULT_SCAN_ROOT;
    const configuration = (0, configuration_1.mergeProjectConfiguration)((0, configuration_1.readConfigurationFile)(cwd), options.configuration);
    const data = (0, featureRegistry_1.loadBaselineData)();
    return {
        cwd,
        configuration,
        resolvedTargets: (0, configuration_1.resolveTargets)(configuration),
        data,
        analyzerContext: {
            configuration,
            resolvedTargets: (0, configuration_1.resolveTargets)(configuration),
            getFeature: (featureId) => data.features.get(featureId),
            getAllFeatures: () => Array.from(data.featuresByCanonicalId.values()),
            dataVersion: data.version
        }
    };
}
function toSourceDocument(filePath, content, cwd) {
    const language = (0, engine_1.languageFromFilePath)(filePath);
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
function scanWorkspaceFromSources(sources, options = {}) {
    const context = createContext(options);
    const documents = sources
        .filter(source => !(0, configuration_1.isExcludedPath)(source.filePath, context.cwd, context.configuration.excludePatterns))
        .map(source => toSourceDocument(source.filePath, source.content, context.cwd))
        .filter((document) => Boolean(document));
    return (0, engine_1.buildBaselineReport)(documents, context.analyzerContext);
}
exports.scanWorkspaceFromSources = scanWorkspaceFromSources;
function scanWorkspaceFromFileSystem(options = {}) {
    const context = createContext(options);
    const sources = walkDirectory(context.cwd)
        .filter(filePath => !(0, configuration_1.isExcludedPath)(filePath, context.cwd, context.configuration.excludePatterns))
        .map(filePath => {
        try {
            return {
                filePath,
                content: fs.readFileSync(filePath, 'utf8')
            };
        }
        catch {
            return undefined;
        }
    })
        .filter((source) => Boolean(source));
    return scanWorkspaceFromSources(sources, {
        cwd: context.cwd,
        configuration: context.configuration
    });
}
exports.scanWorkspaceFromFileSystem = scanWorkspaceFromFileSystem;
function formatMarkdownSummary(report) {
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
exports.formatMarkdownSummary = formatMarkdownSummary;
//# sourceMappingURL=workspaceScanner.js.map