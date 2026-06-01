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
exports.CompatibilityDiagnosticProvider = void 0;
const vscode = __importStar(require("vscode"));
class CompatibilityDiagnosticProvider {
    constructor(dataService) {
        this.dataService = dataService;
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('baseline');
    }
    async provideDiagnostics(document, _token) {
        const report = await this.dataService.analyzeTextDocument(document);
        return report.findings.map(finding => this.toDiagnostic(document, finding));
    }
    toDiagnostic(document, finding) {
        const range = new vscode.Range(finding.range.start.line, finding.range.start.character, finding.range.end.line, finding.range.end.character);
        const diagnostic = new vscode.Diagnostic(range, this.createMessage(finding), this.toSeverity(finding.severity));
        diagnostic.source = 'GroundWork';
        diagnostic.code = finding.canonicalFeatureId;
        diagnostic.relatedInformation = [
            new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, range), `Unsupported for: ${finding.unsupportedBrowsers.join(', ')}`)
        ];
        return diagnostic;
    }
    createMessage(finding) {
        const lines = [
            finding.message
        ];
        if (finding.recommendation) {
            lines.push(`Recommendation: ${finding.recommendation}`);
        }
        if (finding.fallback) {
            lines.push(`Fallback: ${finding.fallback}`);
        }
        if (finding.unsupportedBrowsers.length > 0) {
            lines.push(`Unsupported targets: ${finding.unsupportedBrowsers.join(', ')}`);
        }
        return lines.join('\n\n');
    }
    toSeverity(severity) {
        switch (severity) {
            case 'error':
                return vscode.DiagnosticSeverity.Error;
            case 'warning':
                return vscode.DiagnosticSeverity.Warning;
            case 'info':
            default:
                return vscode.DiagnosticSeverity.Information;
        }
    }
    async refreshDocument(uri) {
        const document = await vscode.workspace.openTextDocument(uri);
        const diagnostics = await this.provideDiagnostics(document, new vscode.CancellationTokenSource().token);
        this.diagnosticCollection.set(uri, diagnostics);
    }
    clearDiagnostics() {
        this.diagnosticCollection.clear();
    }
}
exports.CompatibilityDiagnosticProvider = CompatibilityDiagnosticProvider;
//# sourceMappingURL=CompatibilityDiagnosticProvider.js.map