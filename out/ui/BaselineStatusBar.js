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
exports.BaselineStatusBar = void 0;
const vscode = __importStar(require("vscode"));
class BaselineStatusBar {
    constructor(dataService) {
        this.dataService = dataService;
        this.isVisible = false;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    }
    initialize() {
        this.updateStatus();
        this.statusBarItem.show();
        this.isVisible = true;
        this.dataService.onDidChangeAnalysis(() => this.updateStatus());
        this.dataService.onDidChangeData(() => this.updateStatus());
    }
    updateStatus() {
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
    show() {
        if (!this.isVisible) {
            this.statusBarItem.show();
            this.isVisible = true;
        }
    }
    hide() {
        if (this.isVisible) {
            this.statusBarItem.hide();
            this.isVisible = false;
        }
    }
    dispose() {
        this.statusBarItem.dispose();
    }
}
exports.BaselineStatusBar = BaselineStatusBar;
//# sourceMappingURL=BaselineStatusBar.js.map