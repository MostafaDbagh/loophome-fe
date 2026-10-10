const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('src/app/admin/orders/orderFlow.ts', 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const helpers = {};
const orderTabs = {};
const tabSource = fs.readFileSync('src/app/admin/orderTabs.ts', 'utf8');
vm.runInNewContext(ts.transpileModule(tabSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: orderTabs });
vm.runInNewContext(output, { exports: helpers, require: (id) => {
  assert.equal(id, '../orderTabs');
  return orderTabs;
} });
const { sellRequestHref, buildOrderTimeline, furnitureStages, canFollowUp } = helpers;
const labels = {
  statuses: { new: 'New', confirmed: 'Confirmed', delivered: 'Delivered' },
  statusChange: (status) => `Status: ${status}`,
  note: 'Team note',
  created: 'Order received',
  payout: 'Owner paid',
  team: 'LoopHome team',
};
// Normalize objects from the isolated VM for strict structural assertions.
const plain = (value) => JSON.parse(JSON.stringify(value));

test('seller request links select the correct state and encode the whole request number', () => {
  const number = 'SELL + 1/2?&اسم';
  for (const status of [undefined, 'new', 'contacted', 'agreed', 'pickup_scheduled']) {
    assert.equal(sellRequestHref({ number, status }), `/admin/orders?tab=sell&state=pending&q=${encodeURIComponent(number)}`);
  }
  for (const status of ['collected', 'listed']) {
    const url = new URL(sellRequestHref({ number, status }), 'https://example.com');
    assert.equal(url.searchParams.get('state'), 'completed');
    assert.equal(url.searchParams.get('q'), number);
  }
  for (const status of ['rejected', 'cancelled']) {
    assert.equal(new URL(sellRequestHref({ number, status }), 'https://example.com').searchParams.get('state'), 'cancelled');
  }
});

test('timeline never invents a completed status or owner payment from current state', () => {
  const entries = plain(buildOrderTimeline({
    status: 'delivered',
    updatedAt: '2026-10-04T12:00:00Z',
    createdAt: '2026-10-01T10:00:00Z',
    seller: { payoutStatus: 'paid' },
  }, labels));
  assert.deepEqual(entries, [{
    id: 'created-2026-10-01T10:00:00Z', kind: 'created',
    at: '2026-10-01T10:00:00Z', by: null, title: 'Order received',
  }]);
  assert.deepEqual(plain(buildOrderTimeline({ seller: { payoutStatus: 'pending', paidAt: '2026-10-03T10:00:00Z' } }, labels)), []);
});

test('notes, statuses, creation and recorded payout share one chronological timeline', () => {
  const entries = plain(buildOrderTimeline({
    createdAt: '2026-10-01T10:00:00Z',
    statusHistory: [
      { status: 'delivered', at: '2026-10-03T12:00:00Z', byName: 'Delivery team', note: 'Customer received item' },
      { status: 'confirmed', at: '2026-10-02T12:00:00Z', byName: 'Mona' },
    ],
    notes: [
      { id: 'call-1', at: '2026-10-03T08:00:00+04:00', byName: 'Ahmed', note: 'Delivery time confirmed' },
      { at: '2026-10-02T13:00:00Z', by: 'Mona', note: 'Customer called' },
    ],
    seller: { payoutStatus: 'paid', paidAt: '2026-10-04T10:00:00Z' },
  }, labels));
  assert.deepEqual(entries.map((entry) => entry.kind), ['payout', 'status', 'note', 'note', 'status', 'created']);
  assert.deepEqual(entries.map((entry) => entry.title), ['Owner paid', 'Status: Delivered', 'Team note', 'Team note', 'Status: Confirmed', 'Order received']);
  assert.equal(entries[1].note, 'Customer received item');
  assert.equal(entries[2].note, 'Delivery time confirmed');
  assert.equal(entries[0].by, null);
  assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length);
});

test('recorded new status prevents duplicate creation and unknown recorded statuses remain readable', () => {
  const entries = plain(buildOrderTimeline({
    createdAt: '2026-10-01T10:00:00Z',
    statusHistory: [
      { status: 'new', at: '2026-10-01T10:00:00Z' },
      { status: 'warehouse_ready', at: '2026-10-02T10:00:00Z' },
    ],
  }, labels));
  assert.deepEqual(entries.map((entry) => entry.kind), ['status', 'status']);
  assert.equal(entries[0].title, 'Status: warehouse_ready');
});

test('invalid or missing timestamps cannot become timeline entries', () => {
  assert.deepEqual(plain(buildOrderTimeline({
    createdAt: 'not a timestamp',
    statusHistory: [{ status: 'delivered', at: 'invalid' }, { status: 'confirmed' }, { status: 'new', at: '' }],
    notes: [{ at: null, note: 'No time' }, { at: '  ', note: 'Blank time' }],
    seller: { payoutStatus: 'paid', paidAt: 'invalid' },
  }, labels)), []);
});

test('actor names win over Mongo IDs and unresolved IDs display the team label', () => {
  const mongoId = '507f1f77bcf86cd799439011';
  const entries = plain(buildOrderTimeline({
    notes: [
      { at: '2026-10-01T10:00:00Z', by: mongoId, byName: '  Mona  ' },
      { at: '2026-10-01T11:00:00Z', by: mongoId.toUpperCase() },
      { at: '2026-10-01T12:00:00Z', by: 'Ahmed' },
      { at: '2026-10-01T13:00:00Z' },
    ],
    statusHistory: [{ status: 'confirmed', at: '2026-10-01T14:00:00Z', by: mongoId }],
  }, labels));
  assert.deepEqual(entries.map((entry) => entry.by), ['LoopHome team', null, 'Ahmed', 'LoopHome team', 'Mona']);
  assert.doesNotMatch(JSON.stringify(entries), /507f1f77bcf86cd799439011/i);
});

test('warehouse pickup stages omit delivery travel while delivery keeps it', () => {
  assert.deepEqual(plain(furnitureStages('pickup')), ['new', 'confirmed', 'delivered']);
  assert.deepEqual(plain(furnitureStages('delivery')), ['new', 'confirmed', 'out_for_delivery', 'delivered']);
  assert.deepEqual(plain(furnitureStages()), plain(furnitureStages('delivery')));
});

test('completed workflow suppresses follow-up even when the linked seller status remains new', () => {
  assert.equal(canFollowUp('sell', 'new', 'completed'), false);
  assert.equal(canFollowUp('sell', 'new', 'pending'), true);
  for (const [tab, configuration] of Object.entries(orderTabs.ORDER_TABS)) {
    for (const status of configuration.states.completed) {
      assert.equal(canFollowUp(tab, status), false, `${tab}/${status} is completed independently of the current filter`);
      assert.equal(canFollowUp(tab, status, 'pending'), false);
    }
    assert.equal(canFollowUp(tab, configuration.states.pending[0], 'pending'), true);
  }
});
