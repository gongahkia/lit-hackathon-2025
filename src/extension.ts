import * as vscode from 'vscode';
import { BaselineDataService } from './services/BaselineDataService';
import { CompatibilityDiagnosticProvider } from './providers/CompatibilityDiagnosticProvider';
import { BaselineHoverProvider } from './providers/BaselineHoverProvider';
import { BaselineTreeDataProvider } from './providers/BaselineTreeDataProvider';
import { BaselineDashboardProvider } from './providers/BaselineDashboardProvider';
import { BaselineStatusBar } from './ui/BaselineStatusBar';
import { BaselineCommands } from './ui/BaselineCommands';

let dataService: BaselineDataService;
let diagnosticProvider: CompatibilityDiagnosticProvider;
let hoverProvider: BaselineHoverProvider;
let featuresTreeDataProvider: BaselineTreeDataProvider;
let warningsTreeDataProvider: BaselineTreeDataProvider;
let dashboardProvider: BaselineDashboardProvider;
let statusBar: BaselineStatusBar;
let commands: BaselineCommands;

export async function activate(context: vscode.ExtensionContext) {
    console.log('GroundWork is now active!');

    // Initialize services
    dataService = new BaselineDataService(context);
    await dataService.initialize();

    // Initialize providers
    diagnosticProvider = new CompatibilityDiagnosticProvider(dataService);
    hoverProvider = new BaselineHoverProvider(dataService);
    featuresTreeDataProvider = new BaselineTreeDataProvider(dataService, 'features');
    warningsTreeDataProvider = new BaselineTreeDataProvider(dataService, 'warnings');
    dashboardProvider = new BaselineDashboardProvider(dataService);

    // Initialize UI components
    statusBar = new BaselineStatusBar(dataService);
    commands = new BaselineCommands(dataService, diagnosticProvider);

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
    const checkDocument = async (document: vscode.TextDocument) => {
        const diagnostics = await diagnosticProvider.provideDiagnostics(document, new vscode.CancellationTokenSource().token);
        diagnosticCollection.set(document.uri, diagnostics || []);
    };

    // Check active document on activation
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        await checkDocument(activeEditor.document);
    }

    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(async event => {
        if (!vscode.workspace.getConfiguration('groundwork').get('autoCheck', true)) {
            return;
        }

        await checkDocument(event.document);
    }));

    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(async document => {
        if (!vscode.workspace.getConfiguration('groundwork').get('autoCheck', true)) {
            return;
        }

        await checkDocument(document);
    }));

    await dataService.scanWorkspace();

    // Register hover provider
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            { scheme: 'file', language: 'html' },
            hoverProvider
        )
    );

    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            { scheme: 'file', language: 'css' },
            hoverProvider
        )
    );

    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            { scheme: 'file', language: 'javascript' },
            hoverProvider
        )
    );

    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            { scheme: 'file', language: 'typescript' },
            hoverProvider
        )
    );

    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            { scheme: 'file', language: 'javascriptreact' },
            hoverProvider
        )
    );

    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            { scheme: 'file', language: 'typescriptreact' },
            hoverProvider
        )
    );

    // Register tree view
    context.subscriptions.push(
        vscode.window.createTreeView('groundworkFeatures', {
            treeDataProvider: featuresTreeDataProvider
        })
    );

    context.subscriptions.push(
        vscode.window.createTreeView('groundworkWarnings', {
            treeDataProvider: warningsTreeDataProvider
        })
    );

    // Register webview panel
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'groundworkDashboard',
            dashboardProvider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('groundwork.checkCompatibility', () => {
            commands.checkCompatibility();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('groundwork.showDashboard', () => {
            commands.showDashboard();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('groundwork.refreshData', () => {
            return commands.refreshData();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('groundwork.configureProject', () => {
            return commands.configureProject();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('groundwork.scanWorkspace', () => {
            return commands.scanWorkspace();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('groundwork.showFeatureDetails', (featureOrId) => {
            return commands.showFeatureDetails(featureOrId);
        })
    );

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

export function deactivate() {
    if (dataService) {
        dataService.dispose();
    }
    if (statusBar) {
        statusBar.dispose();
    }
}
