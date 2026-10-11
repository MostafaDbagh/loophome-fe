const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

/** Run the real list's hooks and callbacks, with a local API and router; SSR renders its real row/panel. */
function createList(query, { lang = 'en', view = 'active', mixedCompleted = false, mixedCancelled = false } = {}) {
  const cache = new Map();
  const hooks = [];
  let cursor = 0;
  let renderingList = false;
  let dirty = true;
  let tree;
  let params = new URLSearchParams(query);
  let pathname = view === 'completed' ? '/admin/completed-orders' : view === 'cancelled' ? '/admin/cancelled-orders' : view === 'intake' ? '/admin/products' : '/admin/orders';
  let pendingEffects = [];
  const requests = [];
  const replacements = [];
  const sameDependencies = (a, b) => a && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const hookReact = {
    ...React,
    useState(initial) {
      if (!renderingList) return React.useState(initial);
      const index = cursor++;
      hooks[index] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [hooks[index].value, (value) => {
        const next = typeof value === 'function' ? value(hooks[index].value) : value;
        if (!Object.is(next, hooks[index].value)) {
          hooks[index].value = next;
          dirty = true;
        }
      }];
    },
    useEffect(effect, dependencies) {
      if (!renderingList) return React.useEffect(effect, dependencies);
      const index = cursor++;
      if (!sameDependencies(hooks[index]?.dependencies, dependencies)) {
        const previous = hooks[index];
        hooks[index] = { dependencies, cleanup: previous?.cleanup };
        pendingEffects.push(() => {
          previous?.cleanup?.();
          hooks[index].cleanup = effect();
        });
      }
    },
  };
  const router = {
    replace(href) {
      replacements.push(href);
      const url = new URL(href, 'https://fixture.local');
      pathname = url.pathname;
      params = url.searchParams;
      dirty = true;
    },
  };
  let adminContext;
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    vm.runInNewContext(compiled, {
      exports, Intl, URLSearchParams, AbortController, Event,
      window: { dispatchEvent() {}, setTimeout() {} },
      require: (id) => {
        if (id === 'react') return hookReact;
        if (id.endsWith('/AdminShell')) return { useAdmin: () => adminContext };
        if (id === 'next/navigation') return { usePathname: () => pathname, useSearchParams: () => params, useRouter: () => router };
        if (id === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
        if (id === '@/lib/adminApi') return {
          adminErrorText: (_, fallback) => fallback,
          adminFetch: (apiPath, init = {}) => {
            assert.equal(init.method ?? 'GET', 'GET', 'the fixture harness never performs a mutation');
            return new Promise((resolve, reject) => requests.push({ path: apiPath, init, resolve, reject, settled: false }));
          },
        };
        if (!id.startsWith('@/') && !id.startsWith('.')) return require(id);
        const base = id.startsWith('@/') ? `src/${id.slice(2)}` : path.resolve(path.dirname(file), id);
        const resolved = ['.ts', '.tsx'].map((extension) => base + extension).find(fs.existsSync);
        assert.ok(resolved, `unresolved dependency ${id}`);
        return load(resolved);
      },
    });
    return exports;
  }
  const { ADMIN_TEXT } = load('src/app/admin/i18n.ts');
  const { ORDER_TABS } = load('src/app/admin/orderTabs.ts');
  const { Orders } = load('src/app/admin/orders/Orders.tsx');
  const { Pagination } = load('src/app/admin/Pagination.tsx');
  const tab = view === 'intake' ? 'sell' : params.get('tab') && params.get('tab') !== 'all' ? params.get('tab') : 'furniture';
  const terminal = ORDER_TABS[tab].states.completed.at(-1);
  const cancelled = ORDER_TABS[tab].states.cancelled[0];
  const prefix = tab === 'sell' ? 'SR' : tab === 'furniture' ? 'OR' : tab.toUpperCase();
  const rows = Array.from({ length: 50 }, (_, index) => ({
    sourceTab: tab,
    id: `fixture-${index + 1}`, number: `${prefix}-${String(index + 1).padStart(6, '0')}`,
    status: index < 21 ? 'new' : index < 40 ? terminal : cancelled,
    title: 'Fixture sofa', item: { title: 'Fixture sofa' }, type: 'list', askingPrice: 0, currency: 'AED',
    customer: tab === 'furniture' ? { name: `Customer ${index + 1}`, phone: '0500000000' } : undefined,
    name: `Owner ${index + 1}`, phone: '0500000000', whatsappUrl: 'https://example.com/fixture-whatsapp', fulfilment: 'pickup',
    createdAt: '2026-10-01T10:00:00Z', nextStatuses: [], payoutStatus: 'pending',
    followUp: { history: [{ action: 'note', at: '2026-10-02T10:00:00Z', by: 'Mona', note: 'Recorded fixture handover' }] },
    notes: [{ at: '2026-10-02T10:00:00Z', byName: 'Mona', note: 'Recorded fixture handover' }],
  }));
  if (mixedCompleted) rows.forEach((row, index) => {
    const tab = ['furniture', 'movers', 'technicians', 'pickup', 'recovery'][index % 5];
    row.sourceTab = tab;
    row.id = `shared-id-${Math.floor(index / 5) + 1}`;
    row.number = `${tab.toUpperCase()}-${String(Math.floor(index / 5) + 1).padStart(6, '0')}`;
    row.status = ORDER_TABS[tab].states.completed[0];
    row.customer = tab === 'furniture' ? { name: `Buyer ${index + 1}`, phone: '0500000000' } : undefined;
    row.completedAt = new Date(Date.UTC(2026, 9, 3, 0, index)).toISOString();
  });
  if (mixedCancelled) rows.forEach((row, index) => {
    const tab = ['sell', 'furniture', 'movers', 'technicians', 'pickup', 'recovery'][index % 6];
    const cycle = Math.floor(index / 6);
    row.sourceTab = tab;
    row.id = `shared-id-${cycle + 1}`;
    row.number = `${tab === 'sell' ? 'SR' : tab === 'furniture' ? 'OR' : tab.toUpperCase()}-${String(cycle + 1).padStart(6, '0')}`;
    row.status = ORDER_TABS[tab].states.cancelled[cycle % ORDER_TABS[tab].states.cancelled.length];
    row.customer = tab === 'furniture' ? { name: `Buyer ${index + 1}`, phone: '0500000000' } : undefined;
    row.cancelledAt = new Date(Date.UTC(2026, 9, 3, 0, index)).toISOString();
  });
  adminContext = { t: ADMIN_TEXT[lang], lang, admin: { role: 'staff' } };

  function render() {
    let attempts = 0;
    while (dirty) {
      assert.ok(attempts++ < 20, 'the real component settles without a render loop');
      dirty = false;
      cursor = 0;
      renderingList = true;
      try { tree = Orders({ view: pathname === '/admin/completed-orders' ? 'completed' : pathname === '/admin/cancelled-orders' ? 'cancelled' : pathname === '/admin/products' ? 'intake' : 'active' }); } finally { renderingList = false; }
      const effects = pendingEffects;
      pendingEffects = [];
      effects.forEach((effect) => effect());
    }
    return tree;
  }
  function response(request) {
    const query = new URL(request.path, 'https://fixture.local').searchParams;
    const completed = new URL(request.path, 'https://fixture.local').pathname === '/admin/completed-orders';
    const cancelled = new URL(request.path, 'https://fixture.local').pathname === '/admin/cancelled-orders';
    const statuses = (query.get('status') ?? '').split(',');
    const search = (query.get('q') ?? '').toLowerCase();
    const payout = query.get('payoutStatus');
    const matching = rows.filter((row) => (completed || cancelled
      ? (cancelled ? ORDER_TABS[row.sourceTab].states.cancelled.includes(row.status) : row.sourceTab !== 'sell' && ORDER_TABS[row.sourceTab].states.completed.includes(row.status))
        && (query.get('tab') === 'all' || query.get('tab') === row.sourceTab)
      : statuses.includes(row.status))
      && (!search || [row.number, row.title, row.name, row.customer?.name ?? ''].some((value) => value.toLowerCase().includes(search)))
      && (!payout || row.payoutStatus === payout && (!completed || row.sourceTab === 'furniture')));
    const page = Number(query.get('page'));
    return { items: matching.slice((page - 1) * 20, page * 20).map((row) => ({ ...row, ...(completed && { tab: row.sourceTab, completedAt: row.completedAt ?? '2026-10-03T10:00:00Z' }), ...(cancelled && { tab: row.sourceTab, cancelledAt: row.cancelledAt ?? '2026-10-03T10:00:00Z' }) })), total: matching.length, page, pages: Math.ceil(matching.length / 20) };
  }
  async function settle(request = requests.find((entry) => !entry.settled), error) {
    assert.ok(request, 'a local request is pending');
    request.settled = true;
    if (error) request.reject(error);
    else request.resolve(response(request));
    await new Promise((resolve) => setImmediate(resolve));
    return render();
  }
  const nodes = (node = tree) => !node || typeof node !== 'object' ? [] : [node, ...[].concat(node.props?.children || []).flatMap((child) => nodes(child))];
  const rowNodes = () => nodes().filter((node) => node.props?.row);
  const findRow = (id, tab) => rowNodes().find((node) => node.props.row.id === id && (!tab || node.props.tab === tab));
  render();
  return {
    rows, requests, replacements, rowNodes, findRow, nodes, render, settle,
    get params() { return params; },
    get pathname() { return pathname; },
    get typeNav() { return nodes().find((node) => ['completed', 'cancelled'].includes(node.props?.view) && node.props?.tab); },
    get typeLinks() { const nav = this.typeNav; return nodes(nav?.type(nav.props)).filter((node) => node.props?.href); },
    get text() { return ADMIN_TEXT[lang]; },
    get pager() { return nodes().find((node) => node.type === Pagination); },
    get loading() { return nodes().some((node) => node.props?.role === 'status' && node.props.children === ADMIN_TEXT[lang].loading); },
    navigate(href) { router.replace(href); return render(); },
  };
}

test('seller All keeps its 40 active or accepted records and archives ten cancellations', async () => {
  const list = createList('tab=sell&state=all');
  await list.settle();
  assert.equal(list.rowNodes().length, 20);
  assert.equal(list.pager.props.pages, 2);
  list.pager.props.onPage(2);
  list.render();
  assert.equal(list.rowNodes().length, 0, 'old rows disappear before the next page arrives');
  await list.settle();
  assert.equal(list.rowNodes().length, 20);
  assert.equal(list.rowNodes()[0].props.row.id, 'fixture-21');
  assert.equal(list.rowNodes().filter((node) => node.props.row.status === 'listed').length, 19);
  list.navigate('/admin/cancelled-orders?tab=sell');
  await list.settle();
  assert.equal(list.rowNodes().length, 10);
  assert.equal(list.rowNodes()[0].props.row.id, 'fixture-41');
});

test('completed archive paginates 50 records from five services and distinguishes matching collection IDs', async () => {
  const list = createList('tab=all', { view: 'completed', mixedCompleted: true });
  await list.settle();
  assert.equal(list.rowNodes().length, 20);
  assert.equal(list.pager.props.pages, 3);
  assert.equal(new Set(list.rowNodes().map((node) => node.key)).size, 20, 'source and ID together identify a row');
  assert.equal(new Set(list.rowNodes().map((node) => node.props.tab)).size, 5);
  list.findRow('shared-id-1', 'furniture').props.onToggle();
  list.render();
  assert.equal(list.findRow('shared-id-1', 'furniture').props.open, true);
  assert.equal(list.findRow('shared-id-1', 'movers').props.open, false, 'another source with the same ID stays closed');
  list.findRow('shared-id-1', 'furniture').props.onChanged('Archive fixture refreshed');
  list.render();
  await list.settle();
  assert.equal(list.findRow('shared-id-1', 'furniture').props.open, true);
  list.findRow('shared-id-1', 'movers').props.onToggle();
  list.render();
  assert.equal(list.findRow('shared-id-1', 'movers').props.open, true);
  assert.equal(list.findRow('shared-id-1', 'furniture').props.open, false);
  const mover = list.findRow('shared-id-1', 'movers');
  assert.equal(mover.props.workflowState, 'completed');
  const html = renderToStaticMarkup(mover);
  assert.match(html, /Recorded fixture handover/);
  assert.doesNotMatch(html, /<form\b|<input\b|<select\b/, 'completed service follow-up is read-only');
  const seen = list.rowNodes().map((node) => `${node.props.tab}:${node.props.row.id}`);
  for (const page of [2, 3]) {
    list.pager.props.onPage(page);
    list.render();
    assert.equal(list.rowNodes().length, 0, 'a prior archive page cannot flash while loading');
    await list.settle();
    assert.equal(list.rowNodes().length, page === 2 ? 20 : 10);
    seen.push(...list.rowNodes().map((node) => `${node.props.tab}:${node.props.row.id}`));
  }
  assert.equal(seen.length, 50);
  assert.equal(new Set(seen).size, 50, 'global pagination neither duplicates nor loses cross-service records');
});

test('cancelled archive paginates 50 cancelled or rejected records across all six services with read-only history', async () => {
  const list = createList('tab=all', { view: 'cancelled', mixedCancelled: true });
  await list.settle();
  assert.equal(list.rowNodes().length, 20);
  assert.equal(list.pager.props.pages, 3);
  assert.equal(new Set(list.rowNodes().map((node) => node.key)).size, 20);
  assert.equal(new Set(list.rowNodes().map((node) => node.props.tab)).size, 6);
  for (const tab of ['sell', 'furniture', 'movers', 'technicians', 'pickup', 'recovery']) {
    list.findRow('shared-id-1', tab).props.onToggle();
    list.render();
    const expanded = list.findRow('shared-id-1', tab);
    assert.equal(expanded.props.open, true);
    assert.equal(expanded.props.workflowState, 'cancelled');
    assert.equal(list.rowNodes().filter((node) => node.props.open).length, 1, 'source-qualified IDs prevent another collection opening');
    const html = renderToStaticMarkup(expanded);
    assert.match(html, /Recorded fixture handover/);
    assert.doesNotMatch(html, /<form\b|<input\b|<select\b/, `${tab}: cancelled follow-up stays read-only`);
  }
  list.findRow('shared-id-1', 'recovery').props.onChanged('Dispute fixture saved');
  list.render();
  assert.equal(list.rowNodes().length, 0);
  await list.settle();
  assert.equal(list.findRow('shared-id-1', 'recovery').props.open, true, 'saved dispute refresh preserves archive expansion');
  const seen = list.rowNodes().map((node) => `${node.props.tab}:${node.props.row.id}`);
  for (const page of [2, 3]) {
    list.pager.props.onPage(page); list.render();
    assert.equal(list.rowNodes().length, 0);
    await list.settle();
    assert.equal(list.rowNodes().length, page === 2 ? 20 : 10);
    seen.push(...list.rowNodes().map((node) => `${node.props.tab}:${node.props.row.id}`));
  }
  assert.equal(new Set(seen).size, 50);
});

test('cancelled navigation includes sellers and every service and strips irrelevant payout filters', async () => {
  for (const lang of ['en', 'ar']) {
    const list = createList('tab=all&payoutStatus=pending&state=completed', { view: 'cancelled', mixedCancelled: true, lang });
    const links = list.typeLinks;
    assert.deepEqual(links.map((node) => new URL(node.props.href, 'https://fixture.local').searchParams.get('tab')), ['all', 'sell', 'furniture', 'movers', 'technicians', 'pickup', 'recovery']);
    assert.equal(links[0].props['aria-current'], 'page');
    const apiUrl = new URL(list.requests[0].path, 'https://fixture.local');
    assert.equal(apiUrl.pathname, '/admin/cancelled-orders');
    assert.equal(apiUrl.searchParams.get('payoutStatus'), null);
    for (const node of links) {
      const url = new URL(node.props.href, 'https://fixture.local');
      assert.equal(url.pathname, '/admin/cancelled-orders');
      assert.equal(url.searchParams.get('payoutStatus'), null);
    }
    await list.settle();
    assert.ok(list.rowNodes().every((node) => node.props.workflowState === 'cancelled'), 'the archive lifecycle overrides a stale state query');
    list.navigate(links.find((node) => node.props.children === list.text.sell).props.href);
    assert.equal(list.rowNodes().length, 0);
    await list.settle();
    assert.equal(list.rowNodes().length, 9);
    assert.ok(list.rowNodes().every((node) => node.props.tab === 'sell'));
    assert.ok(list.rowNodes().some((node) => node.props.row.status === 'rejected'));
    assert.ok(list.rowNodes().some((node) => node.props.row.status === 'cancelled'));
  }
});

test('all legacy cancelled links redirect before fetching and preserve page and query only', () => {
  for (const tab of ['sell', 'furniture', 'movers', 'technicians', 'pickup', 'recovery']) {
    const list = createList(`tab=${tab}&state=cancelled&page=2&q=Fixture&payoutStatus=pending`);
    assert.equal(list.pathname, '/admin/cancelled-orders');
    assert.equal(list.params.get('tab'), tab);
    assert.equal(list.params.get('page'), '2');
    assert.equal(list.params.get('q'), 'Fixture');
    assert.equal(list.params.get('state'), null);
    assert.equal(list.params.get('payoutStatus'), null);
    assert.equal(list.requests.length, 1, 'the obsolete regular cancelled endpoint is never fetched');
    assert.equal(new URL(list.requests[0].path, 'https://fixture.local').pathname, '/admin/cancelled-orders');
  }
});

test('a completed-view response cannot show rows or recover the cancelled archive page after navigation', async () => {
  const list = createList('tab=furniture&page=9', { view: 'completed', mixedCancelled: true });
  const stale = list.requests[0];
  list.navigate('/admin/cancelled-orders?tab=all&page=2');
  await list.settle(stale);
  assert.equal(stale.init.signal.aborted, true);
  assert.equal(list.rowNodes().length, 0);
  assert.equal(list.params.get('page'), '2');
  assert.equal(list.replacements.length, 1);
  await list.settle();
  assert.equal(list.rowNodes().length, 20);
  assert.equal(list.pager.props.page, 2);
});

test('regular buyer and service All lists separate finished and cancelled archives', async () => {
  for (const tab of ['furniture', 'movers', 'technicians', 'pickup', 'recovery']) {
    const list = createList(`tab=${tab}`);
    await list.settle();
    assert.equal(list.pager.props.pages, 2, tab);
    list.pager.props.onPage(2);
    list.render();
    await list.settle();
    assert.equal(list.rowNodes().length, 1, `${tab}: only 21 active records stay in the regular All list`);
    assert.equal(list.rowNodes()[0].props.row.status, 'new');
    list.navigate(`/admin/completed-orders?tab=${tab}`);
    await list.settle();
    assert.equal(list.rowNodes().length, 19, `${tab}: only the 19 completed records appear in the archive`);
    assert.ok(list.rowNodes().every((node) => node.props.workflowState === 'completed' && node.props.tab === tab));
    list.navigate(`/admin/cancelled-orders?tab=${tab}`);
    await list.settle();
    assert.equal(list.rowNodes().length, 10, `${tab}: cancellations appear in their own archive`);
    assert.ok(list.rowNodes().every((node) => node.props.workflowState === 'cancelled' && node.props.tab === tab));
  }
});

test('completed service navigation supports all five sources and keeps payout filtering buyer-only', async () => {
  for (const lang of ['en', 'ar']) {
    const list = createList('tab=all&page=2&q=Fixture&payoutStatus=pending', { view: 'completed', mixedCompleted: true, lang });
    const links = list.typeLinks;
    assert.deepEqual(links.map((node) => new URL(node.props.href, 'https://fixture.local').searchParams.get('tab')), ['all', 'furniture', 'movers', 'technicians', 'pickup', 'recovery']);
    assert.equal(links[0].props['aria-current'], 'page');
    for (const node of links) {
      const url = new URL(node.props.href, 'https://fixture.local');
      assert.equal(url.pathname, '/admin/completed-orders');
      assert.equal(url.searchParams.get('page'), null);
      assert.equal(url.searchParams.get('q'), null);
      assert.equal(url.searchParams.get('payoutStatus'), ['all', 'furniture'].includes(url.searchParams.get('tab')) ? 'pending' : null);
    }
    // Select a fresh all-services filter so the local ten buyer records fit on its first page.
    list.navigate(links[0].props.href);
    await list.settle(list.requests.at(-1));
    assert.equal(list.rowNodes().length, 10);
    assert.ok(list.rowNodes().every((node) => node.props.tab === 'furniture'));
    list.navigate(links.find((node) => node.props.children === list.text.movers).props.href);
    await list.settle(list.requests.at(-1));
    assert.equal(list.rowNodes().length, 10);
    assert.ok(list.rowNodes().every((node) => node.props.tab === 'movers'));
  }
});

test('legacy completed buyer links redirect before fetching and retain search, page and payout', () => {
  const list = createList('tab=furniture&state=completed&page=2&q=Fixture&payoutStatus=pending');
  assert.equal(list.pathname, '/admin/completed-orders');
  assert.equal(list.params.get('state'), null);
  assert.equal(list.params.get('tab'), 'furniture');
  assert.equal(list.params.get('page'), '2');
  assert.equal(list.params.get('q'), 'Fixture');
  assert.equal(list.params.get('payoutStatus'), 'pending');
  assert.equal(list.requests.length, 1, 'the obsolete regular completed endpoint is never fetched');
  assert.equal(new URL(list.requests[0].path, 'https://fixture.local').pathname, '/admin/completed-orders');
});

test('an active-view response cannot show rows or clamp a completed archive page after navigation', async () => {
  const list = createList('tab=furniture&state=pending&page=9', { mixedCompleted: true });
  const stale = list.requests[0];
  list.navigate('/admin/completed-orders?tab=all&page=2');
  await list.settle(stale);
  assert.equal(list.rowNodes().length, 0);
  assert.equal(list.pathname, '/admin/completed-orders');
  assert.equal(list.params.get('page'), '2');
  assert.equal(list.replacements.length, 1);
  await list.settle();
  assert.equal(list.rowNodes().length, 20);
  assert.equal(list.pager.props.page, 2);
});

test('accepting the final pending row returns to the remaining page without losing search', async () => {
  const list = createList('tab=sell&state=pending&page=2&q=Fixture');
  await list.settle();
  const lastRow = list.findRow('fixture-21');
  assert.ok(lastRow);
  list.rows[20].status = 'listed';
  lastRow.props.onChanged('Accepted fixture item');
  list.render();
  await list.settle();
  assert.equal(list.params.get('page') ?? '1', '1');
  assert.equal(list.params.get('state'), 'pending');
  assert.equal(list.params.get('q'), 'Fixture');
  assert.equal(list.loading, true, 'recovery hides the invalid-page result while loading the remaining records');
  await list.settle();
  assert.equal(list.rowNodes().length, 20);
  assert.equal(list.pager.props.page, 1);
});

test('paying the final filtered owner returns to the remaining page and retains payout filtering', async () => {
  const list = createList('tab=furniture&page=2&q=Fixture&payoutStatus=pending', { view: 'completed' });
  list.rows.forEach((row, index) => { row.status = 'delivered'; row.payoutStatus = index < 21 ? 'pending' : 'paid'; });
  await list.settle();
  const lastRow = list.findRow('fixture-21');
  assert.ok(lastRow);
  list.rows[20].payoutStatus = 'paid';
  lastRow.props.onChanged('Owner paid');
  list.render();
  await list.settle();
  assert.equal(list.params.get('page') ?? '1', '1');
  assert.equal(list.params.get('tab'), 'furniture');
  assert.equal(list.pathname, '/admin/completed-orders');
  assert.equal(list.params.get('state'), null);
  assert.equal(list.params.get('q'), 'Fixture');
  assert.equal(list.params.get('payoutStatus'), 'pending');
  await list.settle();
  assert.equal(list.rowNodes().length, 20);
});

for (const tab of ['sell', 'furniture', 'movers', 'technicians', 'pickup', 'recovery']) {
  test(`${tab} cancelling the final pending page archives the record and preserves the remaining-page filters`, async () => {
    const list = createList(`tab=${tab}&state=pending&page=2&q=Fixture`);
    await list.settle();
    const last = list.findRow('fixture-21');
    assert.ok(last);
    const row = list.rows[20];
    row.status = tab === 'furniture' ? 'cancelled' : 'rejected';
    last.props.onChanged('Fixture cancelled'); list.render();
    await list.settle();
    assert.equal(list.params.get('page'), null);
    assert.equal(list.params.get('state'), 'pending');
    assert.equal(list.params.get('q'), 'Fixture');
    assert.equal(list.rowNodes().length, 0, 'the empty final page remains hidden during recovery');
    await list.settle();
    assert.equal(list.rowNodes().length, 20);
    assert.equal(list.findRow(row.id), undefined);
    list.navigate(`/admin/cancelled-orders?tab=${tab}&q=${row.number}`);
    await list.settle();
    const archived = list.findRow(row.id);
    assert.equal(archived.props.open, true);
    assert.equal(archived.props.tab, tab);
    assert.equal(archived.props.workflowState, 'cancelled');
    assert.match(renderToStaticMarkup(archived), /Recorded fixture handover/);
    assert.doesNotMatch(renderToStaticMarkup(archived), /<form\b|<input\b|<select\b/);
  });

  test(`${tab} preserves expansion on saves and moves completed work to its correct list`, async () => {
    const list = createList(`tab=${tab}&state=all`);
    await list.settle();
    list.findRow('fixture-1').props.onToggle?.();
    list.render();
    assert.equal(list.findRow('fixture-1').props.open, true);
    list.findRow('fixture-1').props.onChanged('Fixture note saved');
    list.render();
    assert.equal(list.rowNodes().length, 0, 'mutation refresh hides old rows');
    await list.settle();
    assert.equal(list.findRow('fixture-1').props.open, true, 'the same record stays expanded after a save');
    list.rows[0].status = tab === 'sell' ? 'listed' : tab === 'furniture' ? 'delivered' : 'completed';
    list.findRow('fixture-1').props.onChanged('Fixture completed');
    list.render();
    await list.settle();
    const completed = list.findRow('fixture-1');
    if (tab === 'sell') {
      assert.equal(completed.props.open, true, 'accepted seller intake remains in its regular list');
    } else {
      assert.equal(completed, undefined, 'finished buyer and service work leaves the regular list');
      list.navigate(`/admin/completed-orders?tab=${tab}&q=${list.rows[0].number}`);
      assert.equal(list.rowNodes().length, 0, 'regular rows cannot flash while the archive is loading');
      await list.settle();
      assert.equal(list.findRow('fixture-1').props.open, true);
      assert.equal(list.findRow('fixture-1').props.tab, tab);
      assert.equal(list.findRow('fixture-1').props.workflowState, 'completed');
    }
    const html = renderToStaticMarkup(list.findRow('fixture-1'));
    assert.match(html, /Recorded fixture handover/);
    assert.doesNotMatch(html, /<form\b|<input\b|<select\b/, 'terminal history survives without editable follow-up');
  });
}

test('an exact searched request stays deliberately collapsed after refresh', async () => {
  const list = createList('tab=sell&state=all&q=SR-000001');
  await list.settle();
  assert.equal(list.findRow('fixture-1').props.open, true);
  list.findRow('fixture-1').props.onToggle();
  list.render();
  assert.equal(list.findRow('fixture-1').props.open, false);
  list.findRow('fixture-1').props.onChanged('Fixture updated');
  list.render();
  await list.settle();
  assert.equal(list.findRow('fixture-1').props.open, false);
});

test('an old filter response cannot show rows or recover the new filter page', async () => {
  const list = createList('tab=sell&state=pending&page=2');
  const stale = list.requests[0];
  list.navigate('/admin/orders?tab=sell&state=completed&page=1');
  await list.settle(stale);
  assert.equal(list.rowNodes().length, 0);
  assert.equal(list.params.get('state'), 'completed');
  assert.equal(list.replacements.length, 1, 'a stale response cannot navigate the current filter');
  await list.settle();
  assert.equal(list.rowNodes().length, 19);
  assert.ok(list.rowNodes().every((node) => node.props.row.status === 'listed'));
});

test('invalid URL pages never reach the API as fractional, nonfinite or out-of-bounds values', () => {
  for (const [input, expected] of [['2.5', '1'], ['Infinity', '1'], ['NaN', '1'], ['-2', '1'], ['0', '1'], ['10001', '10000'], ['3', '3']]) {
    const list = createList(`tab=sell&page=${encodeURIComponent(input)}`);
    assert.equal(new URL(list.requests[0].path, 'https://fixture.local').searchParams.get('page'), expected, input);
  }
});

test('a failed list load shows retry and never clamps its requested page', async () => {
  const list = createList('tab=sell&state=pending&page=9&q=Fixture');
  await list.settle(undefined, new Error('Local fixture request failed'));
  assert.equal(list.params.get('page'), '9');
  assert.equal(list.replacements.length, 0);
  assert.equal(list.rowNodes().length, 0);
  assert.ok(list.nodes().some((node) => node.props?.role === 'alert'));
});

test('long pasted URL searches are normalized before fetching and editing', () => {
  const original = `  ${'F'.repeat(125)}  `;
  const list = createList(`tab=sell&state=all&page=2&q=${encodeURIComponent(original)}`);
  const expected = 'F'.repeat(100);
  assert.equal(new URL(list.requests[0].path, 'https://fixture.local').searchParams.get('q'), expected);
  assert.equal(list.params.get('q'), expected);
  assert.equal(list.params.get('page'), '2');
  const input = list.nodes().find((node) => node.type === 'input');
  assert.equal(input.props.value, expected);
  assert.equal(input.props.maxLength, 100);
});

test('completed search submit resets the page and retains the buyer payout filter', async () => {
  const list = createList('tab=furniture&page=2&payoutStatus=pending', { view: 'completed' });
  list.rows.forEach((row) => { row.status = 'delivered'; });
  await list.settle();
  const input = list.nodes().find((node) => node.type === 'input');
  input.props.onChange({ target: { value: '  Fixture  ' } });
  list.render();
  list.nodes().find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  list.render();
  assert.equal(list.params.get('page'), null);
  assert.equal(list.params.get('q'), 'Fixture');
  assert.equal(list.params.get('state'), null);
  assert.equal(list.params.get('payoutStatus'), 'pending');
  await list.settle();
  assert.equal(list.rowNodes().length, 20);
});

test('seller rows identify the seller and contact actions clearly in English and Arabic', async () => {
  for (const lang of ['en', 'ar']) {
    const list = createList('tab=sell&state=all', { lang });
    await list.settle();
    list.findRow('fixture-1').props.onToggle();
    list.render();
    const html = renderToStaticMarkup(list.findRow('fixture-1')).replace(/<!--.*?-->/g, '');
    assert.ok(html.includes(lang === 'ar' ? '>البائع:<' : '>Seller:<'));
    assert.ok(html.includes(lang === 'ar' ? 'اتصال بالبائع' : 'Call seller'));
    assert.ok(html.includes(lang === 'ar' ? 'واتساب البائع' : 'WhatsApp seller'));
    assert.ok(!html.includes(`>${list.text.customer}:<`));
  }
});

test('All items keeps only pending seller submissions across approval, pagination and search', async () => {
  const list = createList('state=completed&tab=furniture', {view:'intake'});
  await list.settle();
  assert.match(list.requests[0].path, /^\/admin\/sell-requests\?/);
  assert.equal(new URL(list.requests[0].path,'https://fixture.test').searchParams.get('status'), 'new,contacted,agreed,pickup_scheduled');
  assert.equal(list.rowNodes().length,20);
  assert.ok(list.rowNodes().every(n => n.props.displayStatus === 'Pending review' && n.props.row.status === 'new'));
  assert.equal(list.nodes().find(n => n.type === 'h1').props.children, 'All items');
  list.rows[0].status = 'listed';
  list.findRow('fixture-1').props.onChanged('Approved'); list.render(); await list.settle();
  assert.equal(list.rowNodes().length,20); assert.equal(list.findRow('fixture-1'), undefined);
  const input = list.nodes().find(n => n.type === 'input' && n.props.placeholder === list.text.search);
  input.props.onChange({target:{value:'SR-000002'}}); list.render();
  list.nodes().find(n => n.type === 'form').props.onSubmit({preventDefault(){}}); list.render(); await list.settle();
  assert.equal(list.params.get('view'),'intake'); assert.equal(list.params.get('q'),'SR-000002');
  assert.equal(list.rowNodes().length,1); assert.equal(list.rowNodes()[0].props.row.number,'SR-000002');
});

test('pending item search stays in intake while legacy product links retain status management', () => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/admin/products/itemBuckets.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});
  assert.equal(exports.isItemManagerQuery(new URLSearchParams()),false);
  assert.equal(exports.isItemManagerQuery(new URLSearchParams('view=intake&q=SR-000001')),false);
  assert.equal(exports.isItemManagerQuery(new URLSearchParams('view=manage&q=HL-000001')),true);
  assert.equal(exports.isItemManagerQuery(new URLSearchParams('status=reserved')),true);
});
