const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(fetch) {
  const exports = {};
  const output = ts.transpileModule(fs.readFileSync('src/lib/api.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(output, {
    exports, fetch, URLSearchParams,
    process: { env: { NODE_ENV: 'production', API_URL: 'https://api.example.test' } },
    AbortSignal: { timeout(ms) { assert.equal(ms, 8000); return AbortSignal.timeout(15); } },
    require(id) {
      if (id === 'react') return { cache: fn => fn };
      if (id === 'next/server') return { connection: async () => {} };
      if (id === './sample-data') return {};
      throw new Error(`Unexpected dependency: ${id}`);
    },
  });
  return exports;
}
const stalled = signal => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Request was not aborted')), 1000);
  signal.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
});
test('a stalled upstream fails as an outage, never a missing product', async () => {
  const api = load((url, { signal }) => stalled(signal));
  await assert.rejects(api.getProduct('en', 'chair'), api.ApiUnavailableError);
});
test('the deadline also covers a stalled response body', async () => {
  const api = load(async (url, { signal }) => ({ ok: true, json: () => stalled(signal) }));
  await assert.rejects(api.getProduct('en', 'chair'), api.ApiUnavailableError);
});
test('only an upstream 404 produces a missing product', async () => {
  assert.equal(await load(async () => ({ ok: false, status: 404 })).getProduct('en', 'chair'), null);
  const api = load(async () => ({ ok: false, status: 503 }));
  await assert.rejects(api.getProduct('en', 'chair'), api.ApiUnavailableError);
});
