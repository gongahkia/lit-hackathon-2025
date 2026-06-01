const test = require('node:test');
const assert = require('node:assert/strict');

const { analyzeDocument, buildBaselineReport } = require('../out/analyzer/engine');
const { mergeProjectConfiguration, resolveTargets } = require('../out/core/configuration');
const { loadBaselineData } = require('../out/core/featureRegistry');

function createContext(overrides = {}) {
  const configuration = mergeProjectConfiguration(overrides);
  const data = loadBaselineData();

  return {
    configuration,
    resolvedTargets: resolveTargets(configuration),
    getFeature: featureId => data.features.get(featureId),
    getAllFeatures: () => Array.from(data.featuresByCanonicalId.values()),
    dataVersion: data.version
  };
}

test('flags CSS container queries for an older custom browser target', () => {
  const report = analyzeDocument({
    filePath: '/workspace/src/styles/app.css',
    relativePath: 'src/styles/app.css',
    language: 'css',
    content: '.card { display: grid; } @container (min-width: 40rem) { .card { gap: 1rem; } }'
  }, createContext({
    browserSupport: ['chrome 104', 'firefox 109', 'safari 15.6', 'edge 104']
  }));

  const finding = report.findings.find(item => item.canonicalFeatureId === 'container-queries');

  assert.ok(finding);
  assert.equal(finding.severity, 'warning');
  assert.ok(finding.unsupportedBrowsers.some(browser => browser.startsWith('chrome')));
});

test('flags optional chaining for unsupported legacy browser targets', () => {
  const report = analyzeDocument({
    filePath: '/workspace/src/index.ts',
    relativePath: 'src/index.ts',
    language: 'typescript',
    content: 'const value = user?.profile?.name ?? "guest";'
  }, createContext({
    browserSupport: ['chrome 79', 'firefox 73', 'safari 13', 'edge 79']
  }));

  assert.equal(report.findings.length, 2);
  assert.ok(report.findings.some(item => item.canonicalFeatureId === 'javascript-optional-chaining'));
  assert.ok(report.findings.some(item => item.canonicalFeatureId === 'nullish-coalescing'));
});

test('builds a workspace report with findings and opportunities', () => {
  const context = createContext({
    targetMode: 'baseline-year',
    baselineYear: 2020
  });

  const report = buildBaselineReport([
    {
      filePath: '/workspace/src/index.ts',
      relativePath: 'src/index.ts',
      language: 'typescript',
      content: 'const value = user?.profile?.name ?? "guest";'
    },
    {
      filePath: '/workspace/src/styles/app.css',
      relativePath: 'src/styles/app.css',
      language: 'css',
      content: '.card { display: grid; } @container (min-width: 40rem) { .card { transition: opacity 120ms ease; } }'
    }
  ], context);

  assert.equal(report.summary.totalFiles, 2);
  assert.ok(report.summary.totalFindings >= 1);
  assert.ok(report.opportunities.length > 0);
  assert.equal(report.targets.mode, 'baseline-year');
});
