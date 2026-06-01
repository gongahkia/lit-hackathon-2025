import * as vscode from 'vscode';
import * as path from 'path';
import { analyzeDocument, buildBaselineReport, languageFromFilePath } from '../analyzer/engine';
import { loadBaselineData } from '../core/featureRegistry';
import { isExcludedPath, mergeProjectConfiguration, readConfigurationFile, resolveTargets } from '../core/configuration';
import {
    BaselineData,
    BaselineFeature,
    BaselineReport,
    FileAnalysisReport,
    ProjectConfiguration,
    ResolvedTargets,
    SourceDocument,
    SourceLanguage
} from '../types/baseline';

export class BaselineDataService {
    private data: BaselineData;
    private config: ProjectConfiguration;
    private resolvedTargets: ResolvedTargets;
    private workspaceReport?: BaselineReport;
    private context: vscode.ExtensionContext;
    private onDidChangeDataEmitter: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    private onDidChangeAnalysisEmitter: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeData: vscode.Event<void> = this.onDidChangeDataEmitter.event;
    public readonly onDidChangeAnalysis: vscode.Event<void> = this.onDidChangeAnalysisEmitter.event;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.data = loadBaselineData();
        this.config = this.loadConfiguration();
        this.resolvedTargets = resolveTargets(this.config);
    }

    async initialize(): Promise<void> {
        try {
            await this.loadBaselineData();
            this.setupConfigurationWatcher();
            console.log('BaselineDataService initialized successfully');
        } catch (error) {
            console.error('Failed to initialize BaselineDataService:', error);
            vscode.window.showErrorMessage('Failed to initialize Baseline data service');
        }
    }

    private async loadBaselineData(): Promise<void> {
        this.data = loadBaselineData();
        this.resolvedTargets = resolveTargets(this.config);
    }

    private loadConfiguration(): ProjectConfiguration {
        const workspaceConfiguration = vscode.workspace.getConfiguration('groundwork');
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const fileConfiguration = readConfigurationFile(workspaceRoot);

        return mergeProjectConfiguration(
            {
                browserSupport: workspaceConfiguration.get<string[]>('browserSupport'),
                warningLevel: workspaceConfiguration.get<ProjectConfiguration['warningLevel']>('warningLevel'),
                autoCheck: workspaceConfiguration.get<boolean>('autoCheck'),
                cacheDuration: workspaceConfiguration.get<number>('cacheDuration'),
                excludePatterns: workspaceConfiguration.get<string[]>('excludePatterns'),
                targetMode: workspaceConfiguration.get<ProjectConfiguration['targetMode']>('targetMode'),
                baselineYear: workspaceConfiguration.get<number>('baselineYear'),
                widelyAvailableOnDate: workspaceConfiguration.get<string>('widelyAvailableOnDate'),
                includeDownstreamBrowsers: workspaceConfiguration.get<boolean>('includeDownstreamBrowsers')
            },
            fileConfiguration
        );
    }

    private setupConfigurationWatcher(): void {
        this.context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('groundwork')) {
                this.config = this.loadConfiguration();
                this.resolvedTargets = resolveTargets(this.config);
                this.onDidChangeDataEmitter.fire();
                void this.scanWorkspace();
            }
        }));
    }

    getFeature(id: string): BaselineFeature | undefined {
        return this.data.features.get(id);
    }

    getAllFeatures(): BaselineFeature[] {
        return Array.from(this.data.features.values());
    }

    getFeaturesByStatus(status: 'limited' | 'newly' | 'widely'): BaselineFeature[] {
        return this.getAllFeatures().filter(f => f.status === status);
    }

    searchFeatures(query: string): BaselineFeature[] {
        const lowerQuery = query.toLowerCase();
        return this.getAllFeatures().filter(f => 
            f.name.toLowerCase().includes(lowerQuery) ||
            f.description.toLowerCase().includes(lowerQuery) ||
            f.id.toLowerCase().includes(lowerQuery)
        );
    }

    getConfiguration(): ProjectConfiguration {
        return this.config;
    }

    getResolvedTargets(): ResolvedTargets {
        return this.resolvedTargets;
    }

    getWorkspaceReport(): BaselineReport | undefined {
        return this.workspaceReport;
    }

    async analyzeTextDocument(document: vscode.TextDocument): Promise<FileAnalysisReport> {
        const sourceDocument = this.createSourceDocument(document);
        if (!sourceDocument) {
            return {
                filePath: document.uri.fsPath,
                relativePath: document.uri.fsPath,
                language: 'typescript',
                findings: [],
                inventory: [],
                riskScore: 0
            };
        }

        return analyzeDocument(sourceDocument, this.createAnalyzerContext());
    }

    async scanWorkspace(): Promise<BaselineReport | undefined> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            this.workspaceReport = undefined;
            this.onDidChangeAnalysisEmitter.fire();
            return undefined;
        }

        const candidates = await vscode.workspace.findFiles('**/*.{html,htm,css,js,mjs,ts,tsx}');
        const documents: SourceDocument[] = [];

        for (const uri of candidates) {
            if (this.isExcluded(uri.fsPath)) {
                continue;
            }

            const language = languageFromFilePath(uri.fsPath);
            if (!language) {
                continue;
            }

            const bytes = await vscode.workspace.fs.readFile(uri);
            const content = Buffer.from(bytes).toString('utf8');
            documents.push({
                filePath: uri.fsPath,
                relativePath: path.relative(workspaceFolder.uri.fsPath, uri.fsPath).replace(/\\/g, '/'),
                language,
                content
            });
        }

        this.workspaceReport = buildBaselineReport(documents, this.createAnalyzerContext());
        this.onDidChangeAnalysisEmitter.fire();
        return this.workspaceReport;
    }

    async refreshData(): Promise<void> {
        this.config = this.loadConfiguration();
        await this.loadBaselineData();
        this.onDidChangeDataEmitter.fire();
        await this.scanWorkspace();
    }

    getDataVersion(): string {
        return this.data.version;
    }

    getLastUpdated(): Date {
        return this.data.lastUpdated;
    }

    dispose(): void {
        this.onDidChangeDataEmitter.dispose();
        this.onDidChangeAnalysisEmitter.dispose();
    }

    private createAnalyzerContext() {
        return {
            configuration: this.config,
            resolvedTargets: this.resolvedTargets,
            getFeature: (featureId: string) => this.getFeature(featureId),
            getAllFeatures: () => Array.from(this.data.featuresByCanonicalId.values()),
            dataVersion: this.getDataVersion()
        };
    }

    private createSourceDocument(document: vscode.TextDocument): SourceDocument | undefined {
        if (document.uri.scheme !== 'file' || this.isExcluded(document.uri.fsPath)) {
            return undefined;
        }

        const language = this.normalizeLanguage(document.languageId, document.uri.fsPath);
        if (!language) {
            return undefined;
        }

        return {
            filePath: document.uri.fsPath,
            relativePath: this.toRelativePath(document.uri.fsPath),
            language,
            content: document.getText()
        };
    }

    private normalizeLanguage(languageId: string, filePath: string): SourceLanguage | undefined {
        if (languageId === 'javascript' || languageId === 'javascriptreact') {
            return 'javascript';
        }

        if (languageId === 'typescript' || languageId === 'typescriptreact') {
            return 'typescript';
        }

        if (languageId === 'html' || languageId === 'css') {
            return languageId;
        }

        return languageFromFilePath(filePath);
    }

    private toRelativePath(filePath: string): string {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            return filePath;
        }

        return path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
    }

    private isExcluded(filePath: string): boolean {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        return isExcludedPath(filePath, workspaceRoot, this.config.excludePatterns);
    }
}
