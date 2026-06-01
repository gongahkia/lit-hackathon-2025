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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const BaselineDataService_1 = require("./services/BaselineDataService");
const CompatibilityDiagnosticProvider_1 = require("./providers/CompatibilityDiagnosticProvider");
const BaselineHoverProvider_1 = require("./providers/BaselineHoverProvider");
const BaselineTreeDataProvider_1 = require("./providers/BaselineTreeDataProvider");
const BaselineDashboardProvider_1 = require("./providers/BaselineDashboardProvider");
const BaselineStatusBar_1 = require("./ui/BaselineStatusBar");
const BaselineCommands_1 = require("./ui/BaselineCommands");
let dataService;
let diagnosticProvider;
let hoverProvider;
let featuresTreeDataProvider;
let warningsTreeDataProvider;
let dashboardProvider;
let statusBar;
let commands;
async function activate(context) {
    console.log('GroundWork is now active!');
    // Initialize services
    dataService = new BaselineDataService_1.BaselineDataService(context);
    await dataService.initialize();
    // Initialize providers
    diagnosticProvider = new CompatibilityDiagnosticProvider_1.CompatibilityDiagnosticProvider(dataService);
    hoverProvider = new BaselineHoverProvider_1.BaselineHoverProvider(dataService);
    featuresTreeDataProvider = new BaselineTreeDataProvider_1.BaselineTreeDataProvider(dataService, 'features');
    warningsTreeDataProvider = new BaselineTreeDataProvider_1.BaselineTreeDataProvider(dataService, 'warnings');
    dashboardProvider = new BaselineDashboardProvider_1.BaselineDashboardProvider(dataService);
    // Initialize UI components
    statusBar = new BaselineStatusBar_1.BaselineStatusBar(dataService);
    commands = new BaselineCommands_1.BaselineCommands(dataService, diagnosticProvider);
    // Register providers
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('baseline');
    context.subscriptions.push(diagnosticCollection);
    // Set up file watchers for automatic checking
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.{html,htm,css,js,mjs,ts,tsx}');
    watcher.onDidChange(async (uri) => {
        if (vscode.workspace.getConfiguration('groundwork').get('autoCheck', true)) {
            const document = await vscode.workspace.openTextDocument(uri);
            const diagnostics = await diagnosticProvider.provideDiagnostics(document, new vscode.CancellationTokenSource().token);
            diagnosticCollection.set(uri, diagnostics || []);
        }
    });
    watcher.onDidCreate(async () => {
        await dataService.scanWorkspace();
    });
    watcher.onDidDelete(async () => {
        await dataService.scanWorkspace();
    });
    context.subscriptions.push(watcher);
    // Manual diagnostic checking on command
    const checkDocument = async (document) => {
        const diagnostics = await diagnosticProvider.provideDiagnostics(document, new vscode.CancellationTokenSource().token);
        diagnosticCollection.set(document.uri, diagnostics || []);
    };
    // Check active document on activation
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        await checkDocument(activeEditor.document);
    }
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(async (event) => {
        if (!vscode.workspace.getConfiguration('groundwork').get('autoCheck', true)) {
            return;
        }
        await checkDocument(event.document);
    }));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(async (document) => {
        if (!vscode.workspace.getConfiguration('groundwork').get('autoCheck', true)) {
            return;
        }
        await checkDocument(document);
    }));
    await dataService.scanWorkspace();
    // Register hover provider
    context.subscriptions.push(vscode.languages.registerHoverProvider({ scheme: 'file', language: 'html' }, hoverProvider));
    context.subscriptions.push(vscode.languages.registerHoverProvider({ scheme: 'file', language: 'css' }, hoverProvider));
    context.subscriptions.push(vscode.languages.registerHoverProvider({ scheme: 'file', language: 'javascript' }, hoverProvider));
    context.subscriptions.push(vscode.languages.registerHoverProvider({ scheme: 'file', language: 'typescript' }, hoverProvider));
    context.subscriptions.push(vscode.languages.registerHoverProvider({ scheme: 'file', language: 'javascriptreact' }, hoverProvider));
    context.subscriptions.push(vscode.languages.registerHoverProvider({ scheme: 'file', language: 'typescriptreact' }, hoverProvider));
    // Register tree view
    context.subscriptions.push(vscode.window.createTreeView('groundworkFeatures', {
        treeDataProvider: featuresTreeDataProvider
    }));
    context.subscriptions.push(vscode.window.createTreeView('groundworkWarnings', {
        treeDataProvider: warningsTreeDataProvider
    }));
    // Register webview panel
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('groundworkDashboard', dashboardProvider, {
        webviewOptions: {
            retainContextWhenHidden: true
        }
    }));
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('groundwork.checkCompatibility', () => {
        commands.checkCompatibility();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('groundwork.showDashboard', () => {
        commands.showDashboard();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('groundwork.refreshData', () => {
        return commands.refreshData();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('groundwork.configureProject', () => {
        return commands.configureProject();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('groundwork.scanWorkspace', () => {
        return commands.scanWorkspace();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('groundwork.showFeatureDetails', (featureOrId) => {
        return commands.showFeatureDetails(featureOrId);
    }));
    // Initialize status bar
    statusBar.initialize();
    // Update context for when clauses
    vscode.commands.executeCommand('setContext', 'groundwork.hasProject', true);
    vscode.commands.executeCommand('setContext', 'groundwork.hasWarnings', Boolean(dataService.getWorkspaceReport()?.summary.totalFindings));
    dataService.onDidChangeAnalysis(() => {
        const report = dataService.getWorkspaceReport();
        void vscode.commands.executeCommand('setContext', 'groundwork.hasWarnings', Boolean(report?.summary.totalFindings));
    });
    console.log('GroundWork activation complete');
}
exports.activate = activate;
function deactivate() {
    if (dataService) {
        dataService.dispose();
    }
    if (statusBar) {
        statusBar.dispose();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map