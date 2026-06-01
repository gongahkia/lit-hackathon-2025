import * as vscode from 'vscode';
import { BaselineDataService } from '../services/BaselineDataService';

export class BaselineStatusBar {
    private readonly statusBarItem: vscode.StatusBarItem;
    private isVisible = false;

    constructor(private readonly dataService: BaselineDataService) {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    }

    initialize(): void {
        this.updateStatus();
        this.statusBarItem.show();
        this.isVisible = true;

        this.dataService.onDidChangeAnalysis(() => this.updateStatus());
        this.dataService.onDidChangeData(() => this.updateStatus());
    }

    private updateStatus(): void {
        const report = this.dataService.getWorkspaceReport();
        if (!report) {
            this.statusBarItem.text = '$(search) GroundWork: scan workspace';
            this.statusBarItem.tooltip = 'Run a GroundWork workspace scan to populate Baseline results.';
            this.statusBarItem.command = 'groundwork.scanWorkspace';
            return;
        }

        const { errorCount, warningCount, infoCount, totalFindings } = report.summary;
        const score = Math.max(0, 100 - (errorCount * 12 + warningCount * 6 + infoCount * 2));

        this.statusBarItem.text = totalFindings === 0
            ? '$(pass-filled) GroundWork: clear'
            : `$(pulse) GroundWork: ${totalFindings} issues`;
        this.statusBarItem.color = totalFindings === 0
            ? '#22C55E'
            : errorCount > 0
                ? '#F97316'
                : '#FACC15';
        this.statusBarItem.command = 'groundwork.showDashboard';
        this.statusBarItem.tooltip = new vscode.MarkdownString([
            `**GroundWork Workspace Summary**`,
            ``,
            `- Score: ${score}`,
            `- Errors: ${errorCount}`,
            `- Warnings: ${warningCount}`,
            `- Info: ${infoCount}`,
            `- Target: ${report.targets.label}`
        ].join('\n'));
    }

    show(): void {
        if (!this.isVisible) {
            this.statusBarItem.show();
            this.isVisible = true;
        }
    }

    hide(): void {
        if (this.isVisible) {
            this.statusBarItem.hide();
            this.isVisible = false;
        }
    }

    dispose(): void {
        this.statusBarItem.dispose();
    }
}
