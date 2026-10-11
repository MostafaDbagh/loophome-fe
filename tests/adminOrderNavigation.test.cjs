const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports, URLSearchParams,
    require: (id) => {
      assert.ok(id.startsWith('.'), `unexpected external dependency ${id}`);
      return load(path.resolve(path.dirname(file), `${id}.ts`));
    },
  });
  return exports;
}
const tabs = load('src/app/admin/orderTabs.ts');
const flow = load('src/app/admin/orders/orderFlow.ts');
const plain = (value) => JSON.parse(JSON.stringify(value));
const url = (href) => new URL(href, 'https://fixture.local');

test('regular lists exclude completed and cancelled work while seller acceptance remains visible', () => {
  assert.deepEqual(plain(tabs.getActiveOrderStatuses('furniture')), ['new', 'confirmed', 'out_for_delivery']);
  assert.deepEqual(plain(tabs.getActiveOrderStatuses('furniture', 'completed')), []);
  assert.deepEqual(plain(tabs.getActiveOrderStatuses('sell', 'completed')), ['collected', 'listed']);
  assert.ok(tabs.getActiveOrderStatuses('sell').includes('listed'));
  assert.ok(tabs.getActiveOrderStatuses('sell').includes('collected'));
  for (const tab of Object.keys(tabs.ORDER_TABS)) {
    const regular = tabs.getActiveOrderStatuses(tab);
    if (tab !== 'sell') for (const status of tabs.ORDER_TABS[tab].states.completed) assert.ok(!regular.includes(status), `${tab}/${status} belongs to Completed orders`);
    for (const status of tabs.ORDER_TABS[tab].states.cancelled) assert.ok(!regular.includes(status), `${tab}/${status} belongs to Cancelled orders`);
    assert.deepEqual(plain(tabs.getActiveOrderStatuses(tab, 'cancelled')), []);
  }
  assert.ok(tabs.getOrderStatuses('furniture').includes('delivered'), 'canonical all statuses remain available for backend queries');
});

test('50 mixed records partition into regular, completed and cancelled without losing accepted seller intake', () => {
  const kinds = ['sell', 'furniture', 'movers', 'technicians', 'pickup', 'recovery'];
  const records = Array.from({ length: 50 }, (_, index) => {
    const tab = kinds[index % kinds.length];
    const status = index % 5 === 0 ? tab === 'sell' ? 'listed' : tab === 'furniture' ? 'delivered' : 'completed'
      : index % 5 === 1 ? 'cancelled' : 'new';
    return { id: `fixture-${index}`, tab, status, fulfilment: index % 2 ? 'delivery' : 'pickup' };
  });
  const regular = records.filter((row) => tabs.getActiveOrderStatuses(row.tab).includes(row.status));
  const completed = records.filter((row) => tabs.COMPLETED_ORDER_TABS.includes(row.tab)
    && tabs.ORDER_TABS[row.tab].states.completed.includes(row.status));
  const cancelled = records.filter((row) => tabs.ORDER_TABS[row.tab].states.cancelled.includes(row.status));
  assert.equal(regular.length, 32);
  assert.equal(completed.length, 8);
  assert.equal(cancelled.length, 10);
  assert.equal(regular.filter((row) => row.tab === 'sell' && row.status === 'listed').length, 2);
  assert.equal(new Set([...regular, ...completed, ...cancelled].map((row) => row.id)).size, 50);
  assert.ok(!regular.some((row) => completed.some((other) => other.id === row.id)));
  assert.ok(!regular.some((row) => cancelled.some((other) => other.id === row.id)));
});

test('completed tabs exclude seller intake and source mappings cover all six dispute target types', () => {
  assert.deepEqual(plain(tabs.COMPLETED_ORDER_TABS), ['furniture', 'movers', 'technicians', 'pickup', 'recovery']);
  assert.equal(tabs.isCompletedFilterTab('all'), true);
  for (const tab of tabs.COMPLETED_ORDER_TABS) assert.equal(tabs.isCompletedFilterTab(tab), true);
  for (const invalid of [null, 'sell', 'constructor', '__proto__', 'unknown']) assert.equal(tabs.isCompletedFilterTab(invalid), false);
  for (const tab of ['all', ...Object.keys(tabs.ORDER_TABS)]) assert.equal(tabs.isCancelledFilterTab(tab), true);
  for (const invalid of [null, 'constructor', '__proto__', 'unknown']) assert.equal(tabs.isCancelledFilterTab(invalid), false);
  const expected = { furniture: 'order', sell: 'sell_request', movers: 'move', technicians: 'technician', pickup: 'pickup_rental', recovery: 'car_recovery' };
  for (const [tab, source] of Object.entries(expected)) {
    assert.equal(tabs.sourceTypeForTab(tab), source);
    assert.equal(tabs.tabForSourceType(source), tab);
  }
  for (const invalid of [null, 'unknown', 'constructor', '__proto__']) assert.equal(tabs.tabForSourceType(invalid), null);
});

test('completed deep links safely carry search, page and buyer payout filters', () => {
  const number = 'OR + 1/2?&اسم';
  for (const tab of ['all', 'furniture']) {
    const href = url(flow.completedOrderHref(tab, { q: number, page: 3, payoutStatus: 'pending' }));
    assert.equal(href.pathname, '/admin/completed-orders');
    assert.equal(href.searchParams.get('tab'), tab);
    assert.equal(href.searchParams.get('q'), number);
    assert.equal(href.searchParams.get('page'), '3');
    assert.equal(href.searchParams.get('payoutStatus'), 'pending');
  }
  for (const tab of ['movers', 'technicians', 'pickup', 'recovery']) {
    assert.equal(url(flow.completedOrderHref(tab, { payoutStatus: 'paid' })).searchParams.get('payoutStatus'), null);
  }
  assert.equal(flow.completedOrderHref(), '/admin/completed-orders?tab=all');
  assert.equal(url(flow.completedOrderHref('all', { q: ' '.repeat(5), page: Infinity })).searchParams.get('page'), null);
  assert.equal(url(flow.completedOrderHref('all', { q: 'F'.repeat(125), page: 20_000 })).searchParams.get('q').length, 100);
  assert.equal(url(flow.completedOrderHref('all', { page: 20_000 })).searchParams.get('page'), '10000');
});

test('target links distinguish completed buyer fulfilment from accepted seller intake and active records', () => {
  const completedBuyer = url(flow.orderRecordHref('furniture', { number: 'OR-1', status: 'delivered', fulfilment: 'pickup' }));
  assert.equal(completedBuyer.pathname, '/admin/completed-orders');
  assert.equal(completedBuyer.searchParams.get('tab'), 'furniture');
  for (const tab of ['movers', 'technicians', 'pickup', 'recovery']) {
    const href = url(flow.orderRecordHref(tab, { number: 'FIX-1', status: 'completed' }));
    assert.equal(href.pathname, '/admin/completed-orders');
    assert.equal(href.searchParams.get('tab'), tab);
    assert.equal(flow.canFollowUp(tab, 'completed', 'all'), false);
  }
  for (const status of ['listed', 'collected']) {
    const href = url(flow.orderRecordHref('sell', { number: 'SR-1', status }));
    assert.equal(href.pathname, '/admin/orders');
    assert.equal(href.searchParams.get('tab'), 'sell');
    assert.equal(href.searchParams.get('state'), 'completed');
  }
  const active = url(flow.orderRecordHref('furniture', { number: 'OR-2', status: 'confirmed' }));
  assert.equal(active.pathname, '/admin/orders');
  assert.equal(active.searchParams.get('state'), 'pending');
  const cancelled = url(flow.orderRecordHref('sell', { number: 'SR-2', status: 'rejected' }));
  assert.equal(cancelled.pathname, '/admin/cancelled-orders');
  assert.equal(cancelled.searchParams.get('state'), null);
});

test('cancelled links include all six sources, normalize search and pagination, and omit payout state', () => {
  const number = 'SR + 1/2?&اسم';
  assert.equal(flow.cancelledOrderHref(), '/admin/cancelled-orders?tab=all');
  for (const tab of ['all', ...Object.keys(tabs.ORDER_TABS)]) {
    const href = url(flow.cancelledOrderHref(tab, { q: number, page: 3, payoutStatus: 'pending' }));
    assert.equal(href.pathname, '/admin/cancelled-orders');
    assert.equal(href.searchParams.get('tab'), tab);
    assert.equal(href.searchParams.get('q'), number);
    assert.equal(href.searchParams.get('page'), '3');
    assert.equal(href.searchParams.get('payoutStatus'), null);
  }
  assert.equal(url(flow.cancelledOrderHref('all', { q: ' '.repeat(5), page: Infinity })).searchParams.get('page'), null);
  assert.equal(url(flow.cancelledOrderHref('all', { q: 'F'.repeat(125), page: 20_000 })).searchParams.get('q').length, 100);
  assert.equal(url(flow.cancelledOrderHref('all', { page: 20_000 })).searchParams.get('page'), '10000');
  for (const [tab, configuration] of Object.entries(tabs.ORDER_TABS)) {
    for (const status of configuration.states.cancelled) {
      const href = url(flow.orderRecordHref(tab, { number, status }));
      assert.equal(href.pathname, '/admin/cancelled-orders');
      assert.equal(href.searchParams.get('tab'), tab);
      assert.equal(flow.canFollowUp(tab, status, 'all'), false);
    }
  }
});

test('dispute links follow the existing source record and never route removed or unknown targets', () => {
  const source = { type: 'move', tab: 'furniture', id: 'original-record', number: 'MV + 1/?', status: 'completed', exists: true };
  const href = url(flow.disputeSourceHref(source));
  assert.equal(href.pathname, '/admin/completed-orders');
  assert.equal(href.searchParams.get('tab'), 'movers', 'source type wins over contradictory sidebar metadata');
  assert.equal(href.searchParams.get('q'), source.number);
  assert.equal(source.status, 'completed', 'a dispute does not alter the fulfilment lifecycle');
  const seller = url(flow.disputeSourceHref({ type: 'sell_request', number: 'SR-1', status: 'listed', exists: true }));
  assert.equal(seller.pathname, '/admin/orders');
  assert.equal(seller.searchParams.get('state'), 'completed');
  const cancelled = url(flow.disputeSourceHref({ type: 'pickup_rental', number: 'PU-1', status: 'rejected', exists: true }));
  assert.equal(cancelled.pathname, '/admin/cancelled-orders');
  assert.equal(cancelled.searchParams.get('tab'), 'pickup');
  assert.equal(flow.disputeSourceHref({ ...source, exists: false }), null);
  assert.equal(flow.disputeSourceHref({ ...source, type: 'unknown' }), null);
  assert.equal(flow.disputeSourceHref({ ...source, number: '  ' }), null);
});
