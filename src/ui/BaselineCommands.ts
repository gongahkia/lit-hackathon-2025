import * as vscode from 'vscode';
import { BaselineDataService } from '../services/BaselineDataService';
import { CompatibilityDiagnosticProvider } from '../providers/CompatibilityDiagnosticProvider';
import { BaselineFeature, BaselineFinding } from '../types/baseline';

export class BaselineCommands {
    constructor(
        private readonly dataService: BaselineDataService,
        private readonly diagnosticProvider: CompatibilityDiagnosticProvider
    ) {}

    async checkCompatibility(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found.');
            return;
        }

        const report = await this.dataService.analyzeTextDocument(editor.document);
        const diagnostics = await this.diagnosticProvider.provideDiagnostics(editor.document, new vscode.CancellationTokenSource().token);
        const collection = vscode.languages.createDiagnosticCollection('baseline-preview');
        collection.set(editor.document.uri, diagnostics);
        collection.dispose();

        if (report.findings.length === 0) {
            vscode.window.showInformationMessage('No GroundWork compatibility risks found in the active file.');
            return;
        }

        this.showDocumentReport(editor.document.fileName, report.findings);
    }

    async showDashboard(): Promise<void> {
        if (!this.dataService.getWorkspaceReport()) {
            await this.dataService.scanWorkspace();
        }

        await vscode.commands.executeCommand('groundworkDashboard.focus');
    }

    async refreshData(): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Refreshing GroundWork data...',
            cancellable: false
        }, async () => {
            await this.dataService.refreshData();
        });

        vscode.window.showInformationMessage('GroundWork Baseline data refreshed.');
    }

    async scanWorkspace(): Promise<void> {
        const report = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Scanning workspace with GroundWork...',
            cancellable: false
        }, async () => this.dataService.scanWorkspace());

        if (!report) {
            vscode.window.showWarningMessage('Open a workspace folder to run a GroundWork scan.');
            return;
        }

        const message = report.summary.totalFindings === 0
            ? `GroundWork scanned ${report.summary.totalFiles} files with no target risks.`
            : `GroundWork found ${report.summary.totalFindings} issues across ${report.summary.totalFiles} files.`;

        vscode.window.showInformationMessage(message, 'Open Dashboard').then(selection => {
            if (selection === 'Open Dashboard') {
                void this.showDashboard();
            }
        });
    }

    async configureProject(): Promise<void> {
        const configuration = this.dataService.getConfiguration();
        const workspaceConfiguration = vscode.workspace.getConfiguration('groundwork');

        const targetMode = await vscode.window.showQuickPick([
            {
                label: 'Custom browser targets',
                value: 'custom-browser-support',
                description: configuration.targetMode === 'custom-browser-support' ? 'Current' : undefined
            },
            {
                label: 'Baseline widely available',
                value: 'baseline-widely',
                description: configuration.targetMode === 'baseline-widely' ? 'Current' : undefined
            },
            {
                label: 'Baseline year',
                value: 'baseline-year',
                description: configuration.targetMode === 'baseline-year' ? 'Current' : undefined
            }
        ], {
            placeHolder: 'Choose the compatibility targeting mode'
        });

        if (!targetMode) {
            return;
        }

        await workspaceConfiguration.update('targetMode', targetMode.value, vscode.ConfigurationTarget.Workspace);

        if (targetMode.value === 'custom-browser-support') {
            const browserSupport = await vscode.window.showInputBox({
                prompt: 'Enter browser support targets',
                value: configuration.browserSupport.join(', '),
                placeHolder: 'chrome 120, firefox 122, safari 17.2, edge 120'
            });

            if (browserSupport !== undefined) {
                await workspaceConfiguration.update('browserSupport', browserSupport.split(',').map(value => value.trim()), vscode.ConfigurationTarget.Workspace);
            }
        }

        if (targetMode.value === 'baseline-year') {
            const baselineYear = await vscode.window.showInputBox({
                prompt: 'Enter the Baseline year to target',
                value: String(configuration.baselineYear ?? 2023),
                validateInput: value => /^\d{4}$/.test(value) ? null : 'Enter a four-digit year'
            });

            if (baselineYear !== undefined) {
                await workspaceConfiguration.update('baselineYear', Number(baselineYear), vscode.ConfigurationTarget.Workspace);
            }
        }

        if (targetMode.value === 'baseline-widely') {
            const date = await vscode.window.showInputBox({
                prompt: 'Optional: specify a historical widely-available date',
                value: configuration.widelyAvailableOnDate ?? '',
                placeHolder: 'YYYY-MM-DD'
            });

            if (date !== undefined) {
                await workspaceConfiguration.update('widelyAvailableOnDate', date, vscode.ConfigurationTarget.Workspace);
            }
        }

        const warningLevel = await vscode.window.showQuickPick([
            { label: 'Error', value: 'error' },
            { label: 'Warning', value: 'warning' },
            { label: 'Info', value: 'info' }
        ], {
            placeHolder: 'Select the editor severity for unsupported features'
        });

        if (warningLevel) {
            await workspaceConfiguration.update('warningLevel', warningLevel.value, vscode.ConfigurationTarget.Workspace);
        }

        await this.dataService.refreshData();
        vscode.window.showInformationMessage('GroundWork project configuration updated.');
    }

    async showFeatureDetails(featureOrId: BaselineFeature | string): Promise<void> {
        const feature = typeof featureOrId === 'string'
            ? this.dataService.getFeature(featureOrId)
            : featureOrId;

        if (!feature) {
            return;
        }

        const quickPick = await vscode.window.showQuickPick([
            { label: 'Open MDN', target: feature.mdn_url },
            { label: 'Open Spec', target: feature.spec_url },
            { label: 'Open Can I Use', target: feature.caniuse_id ? `https://caniuse.com/${feature.caniuse_id}` : undefined }
        ].filter(item => Boolean(item.target)), {
            title: feature.name,
            placeHolder: `${feature.description} (${feature.status})`
        });

        if (quickPick?.target) {
            await vscode.env.openExternal(vscode.Uri.parse(quickPick.target));
        }
    }

    private showDocumentReport(fileName: string, findings: BaselineFinding[]): void {
        const panel = vscode.window.createWebviewPanel(
            'groundworkDocumentReport',
            `GroundWork Report: ${fileName.split('/').pop()}`,
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );

        panel.webview.html = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                    padding: 18px;
                }
                .finding {
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 12px;
                    padding: 14px;
                    margin-bottom: 12px;
                    background: var(--vscode-panel-background);
                }
                .meta {
                    color: var(--vscode-descriptionForeground);
                    font-size: 12px;
                    margin-top: 6px;
                }
                .badge {
                    display: inline-block;
                    border-radius: 999px;
                    padding: 4px 8px;
                    font-size: 11px;
                    font-weight: 700;
                    color: white;
                }
                .error { background: #dc2626; }
                .warning { background: #d97706; }
                .info { background: #0284c7; }
            </style>
        </head>
        <body>
            <h2>${fileName}</h2>
            ${findings.map(finding => `
                <div class="finding">
                    <div><span class="badge ${finding.severity}">${finding.severity.toUpperCase()}</span> <strong>${finding.feature.name}</strong></div>
                    <p>${finding.message}</p>
                    <div class="meta">Unsupported targets: ${finding.unsupportedBrowsers.join(', ')}</div>
                    <div class="meta">Excerpt: <code>${escapeHtml(finding.excerpt)}</code></div>
                </div>
            `).join('')}
        </body>
        </html>`;
    }
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
