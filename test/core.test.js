const test = require('node:test');
const assert = require('node:assert/strict');

const { loadBaselineData } = require('../out/core/featureRegistry');
const { mergeProjectConfiguration, resolveTargets, isExcludedPath } = require('../out/core/configuration');

test('loads Baseline data from official package-backed registry', () => {
  const data = loadBaselineData();
  const feature = data.features.get('css-grid');

  assert.ok(feature);
  assert.equal(feature.canonicalId, 'grid');
  assert.equal(feature.status, 'widely');
  assert.match(data.version, /^web-features@/);
});

test('merges configuration defaults with project overrides', () => {
  const configuration = mergeProjectConfiguration({
    targetMode: 'baseline-year',
    baselineYear: 2023,
    excludePatterns: ['src/generated/**']
  });

  assert.equal(configuration.targetMode, 'baseline-year');
  assert.equal(configuration.baselineYear, 2023);
  assert.deepEqual(configuration.excludePatterns, ['src/generated/**']);
  assert.equal(configuration.browserSupport.includes('chrome 90'), true);
});

test('resolves baseline-year targets via baseline-browser-mapping', () => {
  const resolved = resolveTargets(mergeProjectConfiguration({
    targetMode: 'baseline-year',
    baselineYear: 2022
  }));

  assert.equal(resolved.mode, 'baseline-year');
  assert.equal(resolved.label, 'Baseline year 2022');
  assert.ok(resolved.browsers.length > 0);
  assert.ok(resolved.browserMap.chrome);
});

test('matches exclude patterns against workspace relative paths', () => {
  const excluded = isExcludedPath(
    '/workspace/src/generated/file.ts',
    '/workspace',
    ['src/generated/**']
  );

  const included = isExcludedPath(
    '/workspace/src/app/file.ts',
    '/workspace',
    ['src/generated/**']
  );

  assert.equal(excluded, true);
  assert.equal(included, false);
});
