import * as path from 'path';
import { minimatch } from 'minimatch';
import { BaselineConfig } from './types';
import { scanWorkspaceFromSources } from '../../../src/integrations/workspaceScanner';

export interface BaselineWebpackPluginOptions {
  config?: BaselineConfig;
  cwd?: string;
  failOnError?: boolean;
  failOnWarning?: boolean;
  exclude?: string[];
  include?: string[];
  reportPath?: string;
}

function shouldProcessFile(filename: string, include: string[], exclude: string[]): boolean {
  const included = include.some(pattern => minimatch(filename, pattern, { dot: true, matchBase: true }));
  if (!included) {
    return false;
  }

  return !exclude.some(pattern => minimatch(filename, pattern, { dot: true, matchBase: true }));
}

export class BaselineWebpackPlugin {
  private readonly options: Required<BaselineWebpackPluginOptions>;

  constructor(options: BaselineWebpackPluginOptions = {}) {
    this.options = {
      config: options.config ?? {},
      cwd: options.cwd ?? process.cwd(),
      failOnError: options.failOnError ?? true,
      failOnWarning: options.failOnWarning ?? false,
      exclude: options.exclude ?? ['node_modules/**'],
      include: options.include ?? ['**/*.{html,htm,css,js,mjs,ts,tsx}'],
      reportPath: options.reportPath ?? 'baseline-report.json'
    };
  }

  apply(compiler: {
    webpack?: { Compilation?: { PROCESS_ASSETS_STAGE_ANALYSE?: number } };
    hooks: { compilation: { tap: (name: string, callback: (compilation: any) => void) => void } };
  }): void {
    compiler.hooks.compilation.tap('GroundWorkWebpackPlugin', (compilation: any) => {
      const stage = compiler.webpack?.Compilation?.PROCESS_ASSETS_STAGE_ANALYSE ?? 4000;
      compilation.hooks.processAssets.tap(
        {
          name: 'GroundWorkWebpackPlugin',
          stage
        },
        () => {
          const assets = compilation.assets as Record<string, { source: () => unknown }>;
          const sources = Object.entries(assets)
            .filter(([filename]) => shouldProcessFile(filename, this.options.include, this.options.exclude))
            .map(([filename, asset]) => ({
              filePath: path.resolve(this.options.cwd, filename),
              content: String(asset.source())
            }));

          const report = scanWorkspaceFromSources(sources, {
            cwd: this.options.cwd,
            configuration: this.options.config
          });

          compilation.emitAsset(this.options.reportPath, {
            source: () => JSON.stringify(report, null, 2),
            size: () => JSON.stringify(report, null, 2).length
          });

          for (const finding of report.findings) {
            const location = `${finding.relativePath}:${finding.range.start.line + 1}:${finding.range.start.character + 1}`;
            const error = new Error(`GroundWork: ${location} ${finding.message}`);
            if (finding.severity === 'error' && this.options.failOnError) {
              compilation.errors.push(error);
            }
            if (finding.severity === 'warning' && this.options.failOnWarning) {
              compilation.warnings.push(error);
            }
          }
        }
      );
    });
  }
}
