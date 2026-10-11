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
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(compiled, { exports, Intl, URLSearchParams, require: (id) => {
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
const { OrderRow } = load('src/app/admin/orders/Orders.tsx');

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
    for (const status of configuration.states.completed.filter(value => !["confirmed", "out_for_delivery"].includes(value))) {
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
    for (const status of [...configuration.states.completed, ...configuration.states.cancelled].filter(value => !["confirmed", "out_for_delivery"].includes(value))) {
      const html = renderPanel(request(status, tab), tab, 'all');
      assert.doesNotMatch(html, /<form\b|<input\b|<select\b/, `${tab}/${status} is read-only in all`);
      assert.match(html, tab === 'sell' ? /Owner confirmed handover/ : /Customer received item/);
    }
    const active = renderPanel(request(configuration.states.pending[0], tab), tab, 'all');
    assert.match(active, /<form\b/);
    assert.ok(active.includes(tab === 'sell' ? ADMIN_TEXT.en.saveFollowUp : ADMIN_TEXT.en.saveNote));
  }
});

test('seller and service history names actors and skips invalid events in both languages', () => {
  const id = '507f1f77bcf86cd799439011';
  for (const lang of ['en', 'ar']) {
    for (const tab of ['sell', 'movers', 'technicians', 'pickup', 'recovery']) {
      const row = request('completed', tab);
      const events = [
        { at: '2026-10-02T10:00:00Z', by: id, byName: 'Mona', action: 'note', note: 'Named event' },
        { at: '2026-10-02T11:00:00Z', by: id, action: 'note', note: 'Team event' },
        { at: 'invalid', by: 'Mona', action: 'note', note: 'Invalid event' },
      ];
      row.followUp.history = events;
      row.notes = events;
      row.statusHistory = [{ at: 'invalid', status: 'completed', note: 'Invalid status' }];
      const html = renderPanel(row, tab, 'all', lang);
      assert.match(html, /Mona/);
      assert.ok(html.includes(lang === 'ar' ? 'فريق لوب هوم' : 'LoopHome team'));
      assert.doesNotMatch(html, /507f1f77bcf86cd799439011|Invalid event|Invalid status|Invalid Date/);
    }
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

test('cancelled details show the current outcome reason and keep prior outcomes only in history', () => {
  for (const lang of ['en', 'ar']) {
    for (const tab of Object.keys(ORDER_TABS)) {
      const row = request(tab === 'furniture' ? 'cancelled' : 'rejected', tab);
      row.cancelReason = 'Persisted earlier cancellation field';
      row.rejectReason = 'Persisted earlier rejection field';
      row.statusHistory = [
        { status: row.status, at: '2026-10-05T10:00:00Z', note: 'Current recorded outcome reason' },
        { status: row.status, at: '2026-10-02T10:00:00Z', note: 'Prior outcome kept in history' },
        { status: row.status === 'cancelled' ? 'rejected' : 'cancelled', at: '2026-10-06T10:00:00Z', note: 'Other terminal status history' },
      ];
      const html = renderPanel(row, tab, 'cancelled', lang).replace(/<!--.*?-->/g, '');
      const reason = html.match(new RegExp(`<dt[^>]*>${ADMIN_TEXT[lang].reason}:?</dt><dd[^>]*>[\\s\\S]*?</dd>`))?.[0];
      assert.ok(reason, `${tab}/${lang} shows a reason field`);
      assert.match(reason, /Current recorded outcome reason/);
      assert.doesNotMatch(reason, /Persisted earlier|Prior outcome|Other terminal/);
      assert.match(html, /Prior outcome kept in history/);
      assert.doesNotMatch(html, /<form\b|<input\b|<select\b/);
    }
    const seller = request('cancelled');
    seller.rejectReason = 'Old seller rejection';
    seller.statusHistory = [{ status: 'cancelled', at: '2026-10-05T10:00:00Z', note: 'Seller withdrew after reopening' }];
    const cancelled = renderPanel(seller, 'sell', 'cancelled', lang);
    assert.match(cancelled, /Seller withdrew after reopening/);
    assert.doesNotMatch(cancelled, /Old seller rejection/);
    seller.status = 'new';
    const reopened = renderPanel(seller, 'sell', 'pending', lang);
    assert.doesNotMatch(reopened, /Old seller rejection/);
    assert.match(reopened, /Seller withdrew after reopening/, 'recorded prior history remains visible');
    assert.match(reopened, /<form\b/, 'the reopened seller record remains actionable');
  }
});

test('Sold orders keeps pending delivery and dispatch editable, and delivered records read-only in both languages', () => {
  for (const lang of ['en', 'ar']) {
    for (const status of ['confirmed', 'out_for_delivery']) {
      const html = renderPanel(request(status, 'furniture'), 'furniture', 'completed', lang);
      assert.match(html, /<form\b/);
      assert.ok(html.includes(ADMIN_TEXT[lang].saveNote));
    }
    assert.doesNotMatch(renderPanel(request('delivered', 'furniture'), 'furniture', 'completed', lang), /<form\b|<input\b/);
  }
});
