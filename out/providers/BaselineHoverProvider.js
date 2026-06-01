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
exports.BaselineHoverProvider = void 0;
const vscode = __importStar(require("vscode"));
class BaselineHoverProvider {
    constructor(dataService) {
        this.dataService = dataService;
    }
    async provideHover(document, position, token) {
        const report = await this.dataService.analyzeTextDocument(document);
        const matchingFinding = report.findings.find(finding => this.containsPosition(finding, position));
        if (matchingFinding) {
            const hoverRange = new vscode.Range(matchingFinding.range.start.line, matchingFinding.range.start.character, matchingFinding.range.end.line, matchingFinding.range.end.character);
            return new vscode.Hover(this.createHoverContent(matchingFinding.feature, matchingFinding), hoverRange);
        }
        const word = document.getWordRangeAtPosition(position);
        if (!word) {
            return null;
        }
        const text = document.getText(word);
        const line = document.lineAt(position.line).text;
        // Try to find features based on context
        const features = this.findFeaturesInContext(text, line, position, document);
        if (features.length === 0) {
            return null;
        }
        // Create hover content for the first matching feature
        const feature = features[0];
        const hoverContent = this.createHoverContent(feature);
        return new vscode.Hover(hoverContent, word);
    }
    containsPosition(finding, position) {
        if (position.line < finding.range.start.line || position.line > finding.range.end.line) {
            return false;
        }
        if (position.line === finding.range.start.line && position.character < finding.range.start.character) {
            return false;
        }
        if (position.line === finding.range.end.line && position.character > finding.range.end.character) {
            return false;
        }
        return true;
    }
    findFeaturesInContext(text, line, position, document) {
        const features = [];
        const language = document.languageId;
        // Feature detection patterns
        const patterns = this.getFeaturePatterns(language);
        for (const pattern of patterns) {
            if (pattern.regex.test(line)) {
                const feature = this.dataService.getFeature(pattern.featureId);
                if (feature) {
                    features.push(feature);
                }
            }
        }
        // Also check for exact text matches
        const exactMatch = this.dataService.getFeature(text.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
        if (exactMatch) {
            features.push(exactMatch);
        }
        return features;
    }
    getFeaturePatterns(language) {
        const patterns = [];
        switch (language) {
            case 'html':
                patterns.push({ regex: /<dialog[^>]*>/gi, featureId: 'html-dialog' }, { regex: /<details[^>]*>/gi, featureId: 'html-details' }, { regex: /<summary[^>]*>/gi, featureId: 'html-summary' }, { regex: /<template[^>]*>/gi, featureId: 'html-template' }, { regex: /<slot[^>]*>/gi, featureId: 'html-slot' }, { regex: /<picture[^>]*>/gi, featureId: 'html-picture' }, { regex: /<video[^>]*>/gi, featureId: 'html-video' }, { regex: /<audio[^>]*>/gi, featureId: 'html-audio' }, { regex: /<canvas[^>]*>/gi, featureId: 'html-canvas' }, { regex: /<svg[^>]*>/gi, featureId: 'html-svg' });
                break;
            case 'css':
                patterns.push({ regex: /display:\s*grid/gi, featureId: 'css-grid' }, { regex: /display:\s*flex/gi, featureId: 'css-flexbox' }, { regex: /var\(--/gi, featureId: 'css-custom-properties' }, { regex: /@container/gi, featureId: 'css-container-queries' }, { regex: /subgrid/gi, featureId: 'css-subgrid' }, { regex: /@supports/gi, featureId: 'css-supports' }, { regex: /@media\s+\(prefers-color-scheme/gi, featureId: 'css-prefers-color-scheme' }, { regex: /@media\s+\(prefers-reduced-motion/gi, featureId: 'css-prefers-reduced-motion' }, { regex: /backdrop-filter/gi, featureId: 'css-backdrop-filter' }, { regex: /clip-path/gi, featureId: 'css-clip-path' }, { regex: /mask/gi, featureId: 'css-mask' }, { regex: /shape-outside/gi, featureId: 'css-shape-outside' }, { regex: /object-fit/gi, featureId: 'css-object-fit' }, { regex: /filter:/gi, featureId: 'css-filter' }, { regex: /transform:/gi, featureId: 'css-transform' }, { regex: /transition:/gi, featureId: 'css-transition' }, { regex: /animation:/gi, featureId: 'css-animation' });
                break;
            case 'javascript':
            case 'typescript':
                patterns.push({ regex: /\?\./g, featureId: 'javascript-optional-chaining' }, { regex: /\?\?/g, featureId: 'javascript-nullish-coalescing' }, { regex: /async\s+function/g, featureId: 'javascript-async-await' }, { regex: /await\s+/g, featureId: 'javascript-async-await' }, { regex: /const\s*\{/g, featureId: 'javascript-destructuring' }, { regex: /let\s*\{/g, featureId: 'javascript-destructuring' }, { regex: /const\s*\[/g, featureId: 'javascript-destructuring' }, { regex: /let\s*\[/g, featureId: 'javascript-destructuring' }, { regex: /\.\.\./g, featureId: 'javascript-spread-operator' }, { regex: /=>/g, featureId: 'javascript-arrow-functions' }, { regex: /class\s+\w+/g, featureId: 'javascript-classes' }, { regex: /import\s+.*\s+from/g, featureId: 'javascript-modules' }, { regex: /export\s+/g, featureId: 'javascript-modules' }, { regex: /Promise\./g, featureId: 'javascript-promises' }, { regex: /fetch\(/g, featureId: 'javascript-fetch' }, { regex: /localStorage\./g, featureId: 'javascript-local-storage' }, { regex: /sessionStorage\./g, featureId: 'javascript-session-storage' }, { regex: /addEventListener\(/g, featureId: 'javascript-event-listeners' }, { regex: /querySelector\(/g, featureId: 'javascript-query-selector' }, { regex: /querySelectorAll\(/g, featureId: 'javascript-query-selector' });
                break;
        }
        return patterns;
    }
    createHoverContent(feature, finding) {
        const content = new vscode.MarkdownString();
        // Header with feature name and status
        const statusEmoji = this.getStatusEmoji(feature.status);
        content.appendMarkdown(`## ${statusEmoji} ${feature.name}\n\n`);
        // Description
        content.appendMarkdown(`${feature.description}\n\n`);
        // Baseline status
        content.appendMarkdown(`**Baseline Status:** ${feature.status.toUpperCase()}\n`);
        content.appendMarkdown(`- High Baseline: ${feature.baseline.high}\n`);
        content.appendMarkdown(`- Low Baseline: ${feature.baseline.low}\n\n`);
        // Browser support
        content.appendMarkdown(`**Browser Support:**\n`);
        content.appendMarkdown(`- Chrome: ${feature.support.chrome}+\n`);
        content.appendMarkdown(`- Firefox: ${feature.support.firefox}+\n`);
        content.appendMarkdown(`- Safari: ${feature.support.safari}+\n`);
        content.appendMarkdown(`- Edge: ${feature.support.edge}+\n\n`);
        // Usage recommendation
        if (feature.usage_recommendation) {
            content.appendMarkdown(`**Recommendation:** ${feature.usage_recommendation}\n\n`);
        }
        // Progressive enhancement
        if (feature.progressive_enhancement) {
            content.appendMarkdown(`**Progressive Enhancement:** ${feature.progressive_enhancement}\n\n`);
        }
        if (finding) {
            content.appendMarkdown(`**Current Target Impact:** ${finding.unsupportedBrowsers.join(', ')}\n\n`);
        }
        // Links
        if (feature.mdn_url) {
            content.appendMarkdown(`[MDN Documentation](${feature.mdn_url})`);
        }
        if (feature.spec_url) {
            content.appendMarkdown(` | [Specification](${feature.spec_url})`);
        }
        if (feature.caniuse_id) {
            content.appendMarkdown(` | [Can I Use](https://caniuse.com/${feature.caniuse_id})`);
        }
        content.isTrusted = true;
        return content;
    }
    getStatusEmoji(status) {
        switch (status) {
            case 'widely':
                return '✅';
            case 'newly':
                return '🆕';
            case 'limited':
                return '⚠️';
            default:
                return '❓';
        }
    }
}
exports.BaselineHoverProvider = BaselineHoverProvider;
//# sourceMappingURL=BaselineHoverProvider.js.map