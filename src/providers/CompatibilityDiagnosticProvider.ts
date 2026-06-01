import * as vscode from 'vscode';
import { BaselineDataService } from '../services/BaselineDataService';
import { BaselineFinding } from '../types/baseline';

export class CompatibilityDiagnosticProvider {
    private dataService: BaselineDataService;
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor(dataService: BaselineDataService) {
        this.dataService = dataService;
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('baseline');
    }

    async provideDiagnostics(document: vscode.TextDocument, _token: vscode.CancellationToken): Promise<vscode.Diagnostic[]> {
        const report = await this.dataService.analyzeTextDocument(document);
        return report.findings.map(finding => this.toDiagnostic(document, finding));
    }

    private toDiagnostic(document: vscode.TextDocument, finding: BaselineFinding): vscode.Diagnostic {
        const range = new vscode.Range(
            finding.range.start.line,
            finding.range.start.character,
            finding.range.end.line,
            finding.range.end.character
        );

        const diagnostic = new vscode.Diagnostic(
            range,
            this.createMessage(finding),
            this.toSeverity(finding.severity)
        );

        diagnostic.source = 'GroundWork';
        diagnostic.code = finding.canonicalFeatureId;
        diagnostic.relatedInformation = [
            new vscode.DiagnosticRelatedInformation(
                new vscode.Location(document.uri, range),
                `Unsupported for: ${finding.unsupportedBrowsers.join(', ')}`
            )
        ];

        return diagnostic;
    }

    private createMessage(finding: BaselineFinding): string {
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

    private toSeverity(severity: BaselineFinding['severity']): vscode.DiagnosticSeverity {
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

    async refreshDocument(uri: vscode.Uri): Promise<void> {
        const document = await vscode.workspace.openTextDocument(uri);
        const diagnostics = await this.provideDiagnostics(document, new vscode.CancellationTokenSource().token);
        this.diagnosticCollection.set(uri, diagnostics);
    }

    clearDiagnostics(): void {
        this.diagnosticCollection.clear();
    }
}
