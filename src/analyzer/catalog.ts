import * as ts from 'typescript';
import { SourceLanguage } from '../core/types';

export interface DetectionCatalogEntry {
    id: string;
    featureId: string;
    label: string;
    languages: SourceLanguage[];
    patterns?: RegExp[];
    astMatcher?: (node: ts.Node, sourceFile: ts.SourceFile) => boolean;
}

export const DETECTION_CATALOG: DetectionCatalogEntry[] = [
    {
        id: 'html-dialog',
        featureId: 'dialog',
        label: '<dialog>',
        languages: ['html'],
        patterns: [/<dialog\b/gi]
    },
    {
        id: 'html-details',
        featureId: 'details',
        label: '<details>',
        languages: ['html'],
        patterns: [/<details\b/gi]
    },
    {
        id: 'html-template',
        featureId: 'template',
        label: '<template>',
        languages: ['html'],
        patterns: [/<template\b/gi]
    },
    {
        id: 'html-slot',
        featureId: 'slot',
        label: '<slot>',
        languages: ['html'],
        patterns: [/<slot\b/gi]
    },
    {
        id: 'html-picture',
        featureId: 'picture',
        label: '<picture>',
        languages: ['html'],
        patterns: [/<picture\b/gi]
    },
    {
        id: 'html-video',
        featureId: 'video',
        label: '<video>',
        languages: ['html'],
        patterns: [/<video\b/gi]
    },
    {
        id: 'html-audio',
        featureId: 'audio',
        label: '<audio>',
        languages: ['html'],
        patterns: [/<audio\b/gi]
    },
    {
        id: 'html-canvas',
        featureId: 'canvas',
        label: '<canvas>',
        languages: ['html'],
        patterns: [/<canvas\b/gi]
    },
    {
        id: 'html-svg',
        featureId: 'svg',
        label: '<svg>',
        languages: ['html'],
        patterns: [/<svg\b/gi]
    },
    {
        id: 'css-grid',
        featureId: 'grid',
        label: 'display: grid',
        languages: ['css'],
        patterns: [/display\s*:\s*grid/gi]
    },
    {
        id: 'css-flexbox',
        featureId: 'flexbox',
        label: 'display: flex',
        languages: ['css'],
        patterns: [/display\s*:\s*flex/gi]
    },
    {
        id: 'css-custom-properties',
        featureId: 'custom-properties',
        label: 'Custom properties',
        languages: ['css'],
        patterns: [/var\(--/gi]
    },
    {
        id: 'css-container-queries',
        featureId: 'container-queries',
        label: '@container',
        languages: ['css'],
        patterns: [/@container/gi]
    },
    {
        id: 'css-subgrid',
        featureId: 'subgrid',
        label: 'subgrid',
        languages: ['css'],
        patterns: [/\bsubgrid\b/gi]
    },
    {
        id: 'css-supports',
        featureId: 'supports',
        label: '@supports',
        languages: ['css'],
        patterns: [/@supports/gi]
    },
    {
        id: 'css-prefers-color-scheme',
        featureId: 'prefers-color-scheme',
        label: 'prefers-color-scheme',
        languages: ['css'],
        patterns: [/prefers-color-scheme/gi]
    },
    {
        id: 'css-prefers-reduced-motion',
        featureId: 'prefers-reduced-motion',
        label: 'prefers-reduced-motion',
        languages: ['css'],
        patterns: [/prefers-reduced-motion/gi]
    },
    {
        id: 'css-backdrop-filter',
        featureId: 'backdrop-filter',
        label: 'backdrop-filter',
        languages: ['css'],
        patterns: [/backdrop-filter/gi]
    },
    {
        id: 'css-clip-path',
        featureId: 'clip-path',
        label: 'clip-path',
        languages: ['css'],
        patterns: [/clip-path/gi]
    },
    {
        id: 'css-shape-outside',
        featureId: 'shape-outside',
        label: 'shape-outside',
        languages: ['css'],
        patterns: [/shape-outside/gi]
    },
    {
        id: 'css-object-fit',
        featureId: 'object-fit',
        label: 'object-fit',
        languages: ['css'],
        patterns: [/object-fit/gi]
    },
    {
        id: 'css-filter',
        featureId: 'filter',
        label: 'filter',
        languages: ['css'],
        patterns: [/\bfilter\s*:/gi]
    },
    {
        id: 'css-transitions',
        featureId: 'transitions',
        label: 'transition',
        languages: ['css'],
        patterns: [/\btransition\s*:/gi]
    },
    {
        id: 'css-animations',
        featureId: 'animations-css',
        label: 'animation',
        languages: ['css'],
        patterns: [/\banimation\s*:/gi]
    },
    {
        id: 'javascript-optional-chaining',
        featureId: 'javascript-optional-chaining',
        label: 'Optional chaining',
        languages: ['javascript', 'typescript'],
        astMatcher: node => ts.isPropertyAccessChain(node) || ts.isElementAccessChain(node) || ts.isCallChain(node)
    },
    {
        id: 'javascript-nullish-coalescing',
        featureId: 'nullish-coalescing',
        label: 'Nullish coalescing',
        languages: ['javascript', 'typescript'],
        astMatcher: node => ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
    },
    {
        id: 'javascript-async-await',
        featureId: 'async-await',
        label: 'Async functions',
        languages: ['javascript', 'typescript'],
        astMatcher: node => ts.isFunctionLike(node) && Boolean(node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword))
    },
    {
        id: 'javascript-destructuring',
        featureId: 'destructuring',
        label: 'Destructuring',
        languages: ['javascript', 'typescript'],
        astMatcher: node =>
            ts.isObjectBindingPattern(node) ||
            ts.isArrayBindingPattern(node) ||
            (
                ts.isBinaryExpression(node) &&
                node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
                (ts.isArrayLiteralExpression(node.left) || ts.isObjectLiteralExpression(node.left))
            )
    },
    {
        id: 'javascript-spread',
        featureId: 'spread',
        label: 'Spread syntax',
        languages: ['javascript', 'typescript'],
        astMatcher: node => ts.isSpreadAssignment(node) || ts.isSpreadElement(node)
    },
    {
        id: 'javascript-modules',
        featureId: 'js-modules',
        label: 'JavaScript modules',
        languages: ['javascript', 'typescript'],
        astMatcher: node => ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isExportAssignment(node)
    },
    {
        id: 'javascript-promise',
        featureId: 'promise',
        label: 'Promise',
        languages: ['javascript', 'typescript'],
        astMatcher: node => ts.isIdentifier(node) && node.text === 'Promise'
    },
    {
        id: 'javascript-fetch',
        featureId: 'fetch',
        label: 'fetch',
        languages: ['javascript', 'typescript'],
        astMatcher: node => ts.isIdentifier(node) && node.text === 'fetch'
    }
];
