const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const cache = new Map();
let adminContext;
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  // Test the existing private row component without adding a production export.
  const exposeRow = file.endsWith('/orders/page.tsx') ? '\nexports.OrderRow = OrderRow;' : '';
  vm.runInNewContext(compiled + exposeRow, { exports, Intl, require: (id) => {
    if (id.endsWith('/AdminShell')) return { useAdmin: () => adminContext };
    if (id === '@/lib/adminApi') return { adminFetch: () => assert.fail('rendering must not mutate or fetch live data'), adminErrorText: (_, fallback) => fallback };
    if (id === 'next/navigation') return {};
    if (id === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
    if (!id.startsWith('@/') && !id.startsWith('.')) return require(id);
    const base = id.startsWith('@/') ? `src/${id.slice(2)}` : path.resolve(path.dirname(file), id);
    const resolved = ['.ts', '.tsx'].map((extension) => base + extension).find(fs.existsSync);
    assert.ok(resolved, `unresolved dependency ${id}`);
    return load(resolved);
  } });
  return exports;
}

const { ADMIN_TEXT } = load('src/app/admin/i18n.ts');
const { ORDER_TABS } = load('src/app/admin/orderTabs.ts');
const { RequestPanel } = load('src/app/admin/orders/RequestPanel.tsx');
const { OrderRow } = load('src/app/admin/orders/page.tsx');

function request(status, tab = 'sell') {
  return {
    id: 'fixture-request', number: tab === 'sell' ? 'SR-1' : 'OR-1', status,
    type: 'list', title: 'Fixture sofa', askingPrice: 0, currency: 'AED',
    createdAt: '2026-10-01T10:00:00Z', fulfilment: 'pickup', nextStatuses: [],
    followUp: { status: 'new', due: true, history: [{ action: 'note', at: '2026-10-02T10:00:00Z', by: 'Mona', note: 'Owner confirmed handover' }] },
    notes: [{ at: '2026-10-02T10:00:00Z', byName: 'Mona', note: 'Customer received item' }],
  };
}

function renderPanel(row, tab, workflowState, lang = 'en') {
  adminContext = { t: ADMIN_TEXT[lang], lang, admin: { role: 'staff' } };
  return renderToStaticMarkup(React.createElement(RequestPanel, { row, tab, workflowState, onChanged() {} }));
}

test('completed seller row with internal new status keeps history and removes all follow-up inputs', () => {
  for (const lang of ['en', 'ar']) {
    const html = renderPanel(request('new'), 'sell', 'completed', lang);
    assert.match(html, /Owner confirmed handover/);
    assert.doesNotMatch(html, /<form\b|<input\b|<select\b/);
    assert.ok(!html.includes(ADMIN_TEXT[lang].saveFollowUp));
  }
});

test('canonical completed seller, store and service statuses have history without editable follow-up', () => {
  for (const [tab, configuration] of Object.entries(ORDER_TABS)) {
    for (const status of configuration.states.completed) {
      // Completion wins even if a stale filter still says pending.
      const html = renderPanel(request(status, tab), tab, 'pending');
      assert.doesNotMatch(html, /<form\b|<input\b|<select\b/, `${tab}/${status} must not expose follow-up controls`);
      assert.match(html, tab === 'sell' ? /Owner confirmed handover/ : /Customer received item/);
    }
  }
});

test('pending requests retain their follow-up editor across each workflow', () => {
  for (const [tab, configuration] of Object.entries(ORDER_TABS)) {
    const html = renderPanel(request(configuration.states.pending[0], tab), tab, 'pending');
    assert.match(html, /<form\b/);
    assert.match(html, /<input\b/);
    assert.ok(html.includes(tab === 'sell' ? ADMIN_TEXT.en.saveFollowUp : ADMIN_TEXT.en.saveNote));
  }
});

test('all view keeps terminal histories read-only and active follow-up editable', () => {
  for (const [tab, configuration] of Object.entries(ORDER_TABS)) {
    for (const status of [...configuration.states.completed, ...configuration.states.cancelled]) {
      const html = renderPanel(request(status, tab), tab, 'all');
      assert.doesNotMatch(html, /<form\b|<input\b|<select\b/, `${tab}/${status} is read-only in all`);
      assert.match(html, tab === 'sell' ? /Owner confirmed handover/ : /Customer received item/);
    }
    const active = renderPanel(request(configuration.states.pending[0], tab), tab, 'all');
    assert.match(active, /<form\b/);
    assert.ok(active.includes(tab === 'sell' ? ADMIN_TEXT.en.saveFollowUp : ADMIN_TEXT.en.saveNote));
  }
});

test('expanded completed row passes its workflow state through and removes stale follow-up alerts', () => {
  adminContext = { t: ADMIN_TEXT.en, lang: 'en', admin: { role: 'staff' } };
  const html = renderToStaticMarkup(React.createElement(OrderRow, {
    row: request('new'), tab: 'sell', workflowState: 'completed', t: ADMIN_TEXT.en,
    defaultOpen: true, onChanged() {},
  }));
  assert.match(html, /Owner confirmed handover/);
  assert.doesNotMatch(html, /<form\b|<input\b|<select\b/);
  assert.ok(!html.includes(ADMIN_TEXT.en.followUpDue));
});
