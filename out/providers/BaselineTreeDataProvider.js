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
exports.BaselineTreeItem = exports.BaselineTreeDataProvider = void 0;
const vscode = __importStar(require("vscode"));
class BaselineTreeDataProvider {
    constructor(dataService, mode) {
        this.dataService = dataService;
        this.mode = mode;
        this.onDidChangeTreeDataEmitter = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
        this.dataService.onDidChangeAnalysis(() => this.refresh());
        this.dataService.onDidChangeData(() => this.refresh());
    }
    refresh() {
        this.onDidChangeTreeDataEmitter.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        const report = this.dataService.getWorkspaceReport();
        if (!report) {
            return !element ? [
                new BaselineTreeItem('Run GroundWork Workspace Scan', vscode.TreeItemCollapsibleState.None, {
                    id: `${this.mode}:empty`,
                    icon: 'search',
                    tooltip: 'Run a workspace scan to populate this view.',
                    command: {
                        command: 'groundwork.scanWorkspace',
                        title: 'Run GroundWork Workspace Scan'
                    }
                })
            ] : [];
        }
        if (!element) {
            return this.mode === 'warnings'
                ? this.createWarningRoots(report.findings)
                : this.createFeatureRoots(report.files, report.opportunities);
        }
        switch (element.metadata.id) {
            case 'warnings:errors':
                return report.findings.filter(finding => finding.severity === 'error').map(finding => this.findingItem(finding));
            case 'warnings:warnings':
                return report.findings.filter(finding => finding.severity === 'warning').map(finding => this.findingItem(finding));
            case 'warnings:info':
                return report.findings.filter(finding => finding.severity === 'info').map(finding => this.findingItem(finding));
            case 'features:risk-files':
                return report.files
                    .filter(file => file.riskScore > 0)
                    .sort((left, right) => right.riskScore - left.riskScore)
                    .slice(0, 8)
                    .map(file => this.fileItem(file));
            case 'features:inventory':
                return report.files
                    .flatMap(file => file.inventory)
                    .sort((left, right) => right.occurrences - left.occurrences)
                    .slice(0, 10)
                    .map(entry => this.inventoryItem(entry));
            case 'features:opportunities':
                return report.opportunities.map(opportunity => this.opportunityItem(opportunity));
            default:
                return [];
        }
    }
    createWarningRoots(findings) {
        const errorCount = findings.filter(finding => finding.severity === 'error').length;
        const warningCount = findings.filter(finding => finding.severity === 'warning').length;
        const infoCount = findings.filter(finding => finding.severity === 'info').length;
        return [
            new BaselineTreeItem(`Errors (${errorCount})`, vscode.TreeItemCollapsibleState.Expanded, {
                id: 'warnings:errors',
                icon: 'error'
            }),
            new BaselineTreeItem(`Warnings (${warningCount})`, vscode.TreeItemCollapsibleState.Expanded, {
                id: 'warnings:warnings',
                icon: 'warning'
            }),
            new BaselineTreeItem(`Info (${infoCount})`, vscode.TreeItemCollapsibleState.Collapsed, {
                id: 'warnings:info',
                icon: 'info'
            })
        ];
    }
    createFeatureRoots(files, opportunities) {
        const inventoryCount = files.reduce((count, file) => count + file.inventory.length, 0);
        const riskFileCount = files.filter(file => file.riskScore > 0).length;
        return [
            new BaselineTreeItem(`Top Risk Files (${riskFileCount})`, vscode.TreeItemCollapsibleState.Expanded, {
                id: 'features:risk-files',
                icon: 'flame'
            }),
            new BaselineTreeItem(`Detected Features (${inventoryCount})`, vscode.TreeItemCollapsibleState.Expanded, {
                id: 'features:inventory',
                icon: 'library'
            }),
            new BaselineTreeItem(`Opportunities (${opportunities.length})`, vscode.TreeItemCollapsibleState.Collapsed, {
                id: 'features:opportunities',
                icon: 'rocket'
            })
        ];
    }
    findingItem(finding) {
        return new BaselineTreeItem(finding.feature.name, vscode.TreeItemCollapsibleState.None, {
            id: `finding:${finding.id}`,
            description: `${finding.relativePath}:${finding.range.start.line + 1}`,
            tooltip: `${finding.message}\n\nUnsupported for: ${finding.unsupportedBrowsers.join(', ')}`,
            icon: finding.severity === 'error' ? 'error' : finding.severity === 'warning' ? 'warning' : 'info',
            command: {
                command: 'vscode.open',
                title: 'Open Finding',
                arguments: [
                    vscode.Uri.file(finding.filePath),
                    {
                        selection: new vscode.Range(finding.range.start.line, finding.range.start.character, finding.range.end.line, finding.range.end.character)
                    }
                ]
            }
        });
    }
    fileItem(file) {
        return new BaselineTreeItem(file.relativePath, vscode.TreeItemCollapsibleState.None, {
            id: `file:${file.relativePath}`,
            description: `${file.findings.length} findings`,
            tooltip: `Risk score: ${file.riskScore}\nFindings: ${file.findings.length}`,
            icon: 'file',
            command: {
                command: 'vscode.open',
                title: 'Open File',
                arguments: [vscode.Uri.file(file.filePath)]
            }
        });
    }
    inventoryItem(entry) {
        return new BaselineTreeItem(entry.feature.name, vscode.TreeItemCollapsibleState.None, {
            id: `inventory:${entry.canonicalFeatureId}`,
            description: `${entry.occurrences} uses`,
            tooltip: `${entry.feature.description}\n\nSeen in: ${entry.files.join(', ')}`,
            icon: 'symbol-key',
            command: {
                command: 'groundwork.showFeatureDetails',
                title: 'Show Feature Details',
                arguments: [entry.feature]
            }
        });
    }
    opportunityItem(opportunity) {
        return new BaselineTreeItem(opportunity.feature.name, vscode.TreeItemCollapsibleState.None, {
            id: `opportunity:${opportunity.canonicalFeatureId}`,
            description: 'Compatible now',
            tooltip: opportunity.reason,
            icon: 'rocket',
            command: {
                command: 'groundwork.showFeatureDetails',
                title: 'Show Feature Details',
                arguments: [opportunity.feature]
            }
        });
    }
}
exports.BaselineTreeDataProvider = BaselineTreeDataProvider;
class BaselineTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, metadata) {
        super(label, collapsibleState);
        this.metadata = metadata;
        this.description = metadata.description;
        this.tooltip = metadata.tooltip;
        this.command = metadata.command;
        this.iconPath = new vscode.ThemeIcon(metadata.icon);
    }
}
exports.BaselineTreeItem = BaselineTreeItem;
//# sourceMappingURL=BaselineTreeDataProvider.js.map