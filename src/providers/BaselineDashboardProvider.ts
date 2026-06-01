import * as vscode from 'vscode';
import { BaselineDataService } from '../services/BaselineDataService';
import { BaselineReport } from '../types/baseline';

export class BaselineDashboardProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'groundworkDashboard';
    private view?: vscode.WebviewView;

    constructor(private readonly dataService: BaselineDataService) {
        this.dataService.onDidChangeAnalysis(() => this.refresh());
        this.dataService.onDidChangeData(() => this.refresh());
    }

    resolveWebviewView(webviewView: vscode.WebviewView): void {
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true
        };

        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'scanWorkspace':
                    await this.dataService.scanWorkspace();
                    break;
                case 'showFeature':
                    this.showFeatureDetails(message.featureId);
                    break;
                case 'openFile':
                    if (message.filePath) {
                        await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(message.filePath));
                    }
                    break;
            }
        });

        this.refresh();
    }

    private refresh(): void {
        if (!this.view) {
            return;
        }

        this.view.webview.html = this.render(this.view.webview, this.dataService.getWorkspaceReport());
    }

    private render(_webview: vscode.Webview, report?: BaselineReport): string {
        if (!report) {
            return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background: radial-gradient(circle at top, rgba(34, 197, 94, 0.15), transparent 40%), var(--vscode-editor-background);
                        padding: 20px;
                    }
                    button {
                        border: none;
                        border-radius: 999px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        padding: 10px 16px;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <h2>GroundWork Workspace Scan</h2>
                <p>No workspace report is loaded yet.</p>
                <button onclick="scanWorkspace()">Scan Workspace</button>
                <script>
                    const vscode = acquireVsCodeApi();
                    function scanWorkspace() {
                        vscode.postMessage({ command: 'scanWorkspace' });
                    }
                </script>
            </body>
            </html>`;
        }

        const riskFeatures = aggregateRiskFeatures(report);
        const targetList = report.targets.browsers.map(target => `${target.browser} ${target.version}`).join(', ');

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                :root {
                    color-scheme: light dark;
                }
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background:
                        radial-gradient(circle at top right, rgba(34, 197, 94, 0.14), transparent 28%),
                        radial-gradient(circle at left, rgba(56, 189, 248, 0.10), transparent 24%),
                        var(--vscode-editor-background);
                    margin: 0;
                    padding: 18px;
                }
                .shell {
                    display: grid;
                    gap: 16px;
                }
                .hero {
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 16px;
                    padding: 18px;
                    background: linear-gradient(145deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.02));
                }
                .eyebrow {
                    color: var(--vscode-descriptionForeground);
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    font-size: 11px;
                }
                .hero h2 {
                    margin: 8px 0;
                    font-size: 22px;
                }
                .hero p {
                    margin: 0;
                    color: var(--vscode-descriptionForeground);
                    line-height: 1.5;
                }
                .toolbar {
                    margin-top: 14px;
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                button {
                    border: none;
                    border-radius: 999px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    padding: 10px 16px;
                    cursor: pointer;
                }
                .pill {
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 999px;
                    padding: 8px 12px;
                    color: var(--vscode-descriptionForeground);
                    font-size: 12px;
                }
                .stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 12px;
                }
                .stat {
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 14px;
                    padding: 14px;
                    background: var(--vscode-panel-background);
                }
                .stat strong {
                    display: block;
                    font-size: 24px;
                }
                .stat span {
                    color: var(--vscode-descriptionForeground);
                    font-size: 12px;
                }
                .panel {
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 16px;
                    padding: 16px;
                    background: color-mix(in srgb, var(--vscode-panel-background) 82%, transparent);
                }
                .panel h3 {
                    margin: 0 0 12px 0;
                }
                .list {
                    display: grid;
                    gap: 10px;
                }
                .item {
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 12px;
                    padding: 12px;
                    background: var(--vscode-editor-background);
                }
                .item-head {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    align-items: center;
                    margin-bottom: 6px;
                }
                .item-title {
                    font-weight: 600;
                }
                .meta {
                    color: var(--vscode-descriptionForeground);
                    font-size: 12px;
                }
                .badge {
                    border-radius: 999px;
                    padding: 4px 8px;
                    font-size: 11px;
                    font-weight: 700;
                    color: white;
                }
                .badge.error { background: #dc2626; }
                .badge.warning { background: #d97706; }
                .badge.info { background: #0284c7; }
                .links {
                    margin-top: 8px;
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .link {
                    background: transparent;
                    border: 1px solid var(--vscode-panel-border);
                    color: var(--vscode-foreground);
                }
            </style>
        </head>
        <body>
            <div class="shell">
                <section class="hero">
                    <div class="eyebrow">GroundWork Report</div>
                    <h2>${report.summary.totalFindings === 0 ? 'Targets are currently clear' : 'Compatibility risks surfaced across the workspace'}</h2>
                    <p>${report.targets.label}<br>${targetList}</p>
                    <div class="toolbar">
                        <button onclick="scanWorkspace()">Refresh Scan</button>
                        <div class="pill">${report.summary.totalFiles} files scanned</div>
                        <div class="pill">Data ${report.dataVersion}</div>
                    </div>
                </section>

                <section class="stats">
                    <div class="stat"><strong>${report.summary.totalFindings}</strong><span>Total findings</span></div>
                    <div class="stat"><strong>${report.summary.errorCount}</strong><span>Errors</span></div>
                    <div class="stat"><strong>${report.summary.warningCount}</strong><span>Warnings</span></div>
                    <div class="stat"><strong>${report.opportunities.length}</strong><span>Adoption opportunities</span></div>
                </section>

                <section class="panel">
                    <h3>Top Risk Files</h3>
                    <div class="list">
                        ${report.summary.topRiskFiles.length === 0 ? `<div class="item"><div class="item-title">No high-risk files detected.</div></div>` : report.summary.topRiskFiles.map(file => `
                            <div class="item">
                                <div class="item-head">
                                    <div class="item-title">${file.relativePath}</div>
                                    <span class="badge warning">Risk ${file.riskScore}</span>
                                </div>
                                <div class="meta">${file.findingCount} findings</div>
                                <div class="links">
                                    <button class="link" onclick="openFile('${file.relativePath}')">Open file</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <section class="panel">
                    <h3>Risky Features</h3>
                    <div class="list">
                        ${riskFeatures.length === 0 ? `<div class="item"><div class="item-title">No risky features detected for the current targets.</div></div>` : riskFeatures.map(feature => `
                            <div class="item">
                                <div class="item-head">
                                    <div class="item-title">${feature.name}</div>
                                    <span class="badge ${feature.severity}">${feature.severity.toUpperCase()}</span>
                                </div>
                                <div class="meta">${feature.count} findings across ${feature.files} files</div>
                                <div class="links">
                                    <button class="link" onclick="showFeature('${feature.id}')">Feature details</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <section class="panel">
                    <h3>Ready To Adopt</h3>
                    <div class="list">
                        ${report.opportunities.length === 0 ? `<div class="item"><div class="item-title">No additional opportunities suggested yet.</div></div>` : report.opportunities.map(opportunity => `
                            <div class="item">
                                <div class="item-head">
                                    <div class="item-title">${opportunity.feature.name}</div>
                                    <span class="badge info">READY</span>
                                </div>
                                <div class="meta">${opportunity.reason}</div>
                                <div class="links">
                                    <button class="link" onclick="showFeature('${opportunity.feature.id}')">Feature details</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                const files = ${JSON.stringify(Object.fromEntries(report.files.map(file => [file.relativePath, file.filePath])))};

                function scanWorkspace() {
                    vscode.postMessage({ command: 'scanWorkspace' });
                }

                function showFeature(featureId) {
                    vscode.postMessage({ command: 'showFeature', featureId });
                }

                function openFile(relativePath) {
                    vscode.postMessage({ command: 'openFile', filePath: files[relativePath] });
                }
            </script>
        </body>
        </html>`;
    }

    private showFeatureDetails(featureId: string): void {
        const feature = this.dataService.getFeature(featureId);
        if (!feature) {
            return;
        }

        void vscode.commands.executeCommand('groundwork.showFeatureDetails', feature);
    }
}

function aggregateRiskFeatures(report: BaselineReport): Array<{ id: string; name: string; severity: 'error' | 'warning' | 'info'; count: number; files: number }> {
    const features = new Map<string, { id: string; name: string; severity: 'error' | 'warning' | 'info'; count: number; files: Set<string> }>();

    for (const finding of report.findings) {
        const current = features.get(finding.canonicalFeatureId);
        if (current) {
            current.count += 1;
            current.files.add(finding.relativePath);
            if (current.severity === 'info' && finding.severity !== 'info') {
                current.severity = finding.severity;
            }
            if (current.severity === 'warning' && finding.severity === 'error') {
                current.severity = 'error';
            }
            continue;
        }

        features.set(finding.canonicalFeatureId, {
            id: finding.feature.id,
            name: finding.feature.name,
            severity: finding.severity,
            count: 1,
            files: new Set([finding.relativePath])
        });
    }

    return Array.from(features.values())
        .sort((left, right) => right.count - left.count)
        .slice(0, 8)
        .map(feature => ({
            id: feature.id,
            name: feature.name,
            severity: feature.severity,
            count: feature.count,
            files: feature.files.size
        }));
}
