const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

class ApiUnavailableError extends Error {}
function loadRoute(name, settingsAvailable) {
  let productFetches = 0;
  const settings = settingsAvailable ? { shop: { enabled: false }, sellToUs: { enabled: false } } : null;
  const dependencies = {
    '@/lib/api': {
      ApiUnavailableError,
      getCategories: async () => [],
      getSettings: async () => { if (settingsAvailable === "outage") throw new ApiUnavailableError("API unavailable"); if (settingsAvailable === "dynamic") throw new Error("NEXT_DYNAMIC"); return settings; },
      getBlog: async () => ({ items: [] }),
      getAllProducts: async () => { productFetches++; return []; },
    },
    '@/lib/seo/llms': {
      formatLlms: () => '# LoopHome\nCurrent listing service',
      formatLlmsFull: () => '# LoopHome\nCurrent listing service and policies',
      TEXT_HEADERS: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' },
    },
  };
  const source = fs.readFileSync(`src/app/${name}/route.ts`, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, Response, require: (id) => {
    assert.ok(dependencies[id], `unexpected dependency ${id}`);
    return dependencies[id];
  } });
  return { GET: exports.GET, productFetches: () => productFetches };
}
for (const route of ['llms.txt', 'llms-full.txt']) {
  test(`${route} handles production API failures without swallowing framework errors`, async () => {
    assert.equal((await loadRoute(route, 'outage').GET()).status, 503);
    await assert.rejects(loadRoute(route, 'dynamic').GET(), /NEXT_DYNAMIC/);
  });
  test(`${route} returns a retryable uncacheable response on settings outage`, async () => {
    const response = await loadRoute(route, false).GET();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('retry-after'), '300');
    assert.doesNotMatch(await response.text(), /free pickup|cash offer/i);
  });
  test(`${route} remains readable when current settings are available`, async () => {
    const routeHandler = loadRoute(route, true);
    const response = await routeHandler.GET();
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/plain/);
    assert.match(await response.text(), /# LoopHome/);
    assert.equal(response.headers.get('last-modified'), null);
    if (route === 'llms.txt') assert.equal(routeHandler.productFetches(), 0);
  });
}
