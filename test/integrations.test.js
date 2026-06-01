const test = require('node:test');
const assert = require('node:assert/strict');

const { formatMarkdownSummary, scanWorkspaceFromSources } = require('../out/integrations/workspaceScanner');
const { baselineVitePlugin } = require('../build-tools/vite-plugin');
const { BaselineWebpackPlugin } = require('../build-tools/webpack-plugin');

test('shared filesystem scanner produces the standardized report shape', () => {
  const report = scanWorkspaceFromSources([
    {
      filePath: '/workspace/src/index.ts',
      content: 'const value = user?.profile?.name ?? "guest";'
    },
    {
      filePath: '/workspace/src/styles/app.css',
      content: '.card { display: grid; } @container (min-width: 40rem) { .card { gap: 1rem; } }'
    }
  ], {
    cwd: '/workspace',
    configuration: {
      browserSupport: ['chrome 104', 'firefox 109', 'safari 15.6', 'edge 104']
    }
  });

  assert.equal(typeof report.generatedAt, 'string');
  assert.equal(report.targets.mode, 'custom-browser-support');
  assert.ok(Array.isArray(report.findings));
  assert.ok(Array.isArray(report.files));
  assert.ok(Array.isArray(report.opportunities));
});

test('markdown summary includes findings and opportunities', () => {
  const report = scanWorkspaceFromSources([
    {
      filePath: '/workspace/src/index.ts',
      content: 'const value = user?.profile?.name ?? "guest";'
    }
  ], {
    cwd: '/workspace',
    configuration: {
      browserSupport: ['chrome 79', 'firefox 73', 'safari 13', 'edge 79']
    }
  });

  const markdown = formatMarkdownSummary(report);

  assert.match(markdown, /GroundWork Compatibility Report/);
  assert.match(markdown, /Findings/);
});

test('vite plugin emits the standardized report asset', async () => {
  const plugin = baselineVitePlugin({
    cwd: '/workspace',
    config: {
      browserSupport: ['chrome 79', 'firefox 73', 'safari 13', 'edge 79']
    },
    failOnError: false,
    failOnWarning: false
  });

  let asset;
  plugin.buildStart();
  await plugin.transform.call({ meta: { watchMode: false } }, 'const value = user?.profile?.name ?? "guest";', '/workspace/src/index.ts');
  plugin.generateBundle.call({
    emitFile(payload) {
      asset = payload;
    },
    error(message) {
      throw new Error(message);
    },
    warn() {}
  });

  const report = JSON.parse(asset.source);
  assert.equal(asset.fileName, 'baseline-report.json');
  assert.ok(report.summary.totalFindings >= 1);
});

test('webpack plugin emits the standardized report asset', () => {
  const plugin = new BaselineWebpackPlugin({
    cwd: '/workspace',
    config: {
      browserSupport: ['chrome 79', 'firefox 73', 'safari 13', 'edge 79']
    },
    failOnError: false,
    failOnWarning: false
  });

  let processAssets;
  let emittedAsset;
  const compilation = {
    assets: {
      'src/index.ts': {
        source() {
          return 'const value = user?.profile?.name ?? "guest";';
        }
      }
    },
    errors: [],
    warnings: [],
    emitAsset(name, asset) {
      emittedAsset = { name, source: JSON.parse(asset.source()) };
    },
    hooks: {
      processAssets: {
        tap(_options, callback) {
          processAssets = callback;
        }
      }
    }
  };

  plugin.apply({
    hooks: {
      compilation: {
        tap(_name, callback) {
          callback(compilation);
        }
      }
    }
  });

  processAssets();

  assert.equal(emittedAsset.name, 'baseline-report.json');
  assert.ok(emittedAsset.source.summary.totalFindings >= 1);
});
