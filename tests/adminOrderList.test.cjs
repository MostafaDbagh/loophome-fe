const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

/** Run the real list's hooks and callbacks, with a local API and router; SSR renders its real row/panel. */
function createList(query, { lang = 'en' } = {}) {
  const cache = new Map();
  const hooks = [];
  let cursor = 0;
  let renderingList = false;
  let dirty = true;
  let tree;
  let params = new URLSearchParams(query);
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
      params = new URL(href, 'https://fixture.local').searchParams;
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
    // Keep the test entry private in production.
    const exposeList = file.endsWith('/orders/page.tsx') ? '\nexports.Orders = Orders;' : '';
    vm.runInNewContext(compiled + exposeList, {
      exports, Intl, URLSearchParams, AbortController, Event,
      window: { dispatchEvent() {}, setTimeout() {} },
      require: (id) => {
        if (id === 'react') return hookReact;
        if (id.endsWith('/AdminShell')) return { useAdmin: () => adminContext };
        if (id === 'next/navigation') return { usePathname: () => '/admin/orders', useSearchParams: () => params, useRouter: () => router };
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
  const { Orders } = load('src/app/admin/orders/page.tsx');
  const { Pagination } = load('src/app/admin/Pagination.tsx');
  const tab = params.get('tab') || 'furniture';
  const terminal = ORDER_TABS[tab].states.completed.at(-1);
  const cancelled = ORDER_TABS[tab].states.cancelled[0];
  const prefix = tab === 'sell' ? 'SR' : tab === 'furniture' ? 'OR' : tab.toUpperCase();
  const rows = Array.from({ length: 50 }, (_, index) => ({
    id: `fixture-${index + 1}`, number: `${prefix}-${String(index + 1).padStart(6, '0')}`,
    status: index < 21 ? 'new' : index < 40 ? terminal : cancelled,
    title: 'Fixture sofa', item: { title: 'Fixture sofa' }, type: 'list', askingPrice: 0, currency: 'AED',
    customer: tab === 'furniture' ? { name: `Customer ${index + 1}`, phone: '0500000000' } : undefined,
    name: `Owner ${index + 1}`, phone: '0500000000', whatsappUrl: 'https://example.com/fixture-whatsapp', fulfilment: 'pickup',
    createdAt: '2026-10-01T10:00:00Z', nextStatuses: [], payoutStatus: 'pending',
    followUp: { history: [{ action: 'note', at: '2026-10-02T10:00:00Z', by: 'Mona', note: 'Recorded fixture handover' }] },
    notes: [{ at: '2026-10-02T10:00:00Z', byName: 'Mona', note: 'Recorded fixture handover' }],
  }));
  adminContext = { t: ADMIN_TEXT[lang], lang, admin: { role: 'staff' } };

  function render() {
    let attempts = 0;
    while (dirty) {
      assert.ok(attempts++ < 20, 'the real component settles without a render loop');
      dirty = false;
      cursor = 0;
      renderingList = true;
      try { tree = Orders(); } finally { renderingList = false; }
      const effects = pendingEffects;
      pendingEffects = [];
      effects.forEach((effect) => effect());
    }
    return tree;
  }
  function response(request) {
    const query = new URL(request.path, 'https://fixture.local').searchParams;
    const statuses = query.get('status').split(',');
    const search = (query.get('q') ?? '').toLowerCase();
    const payout = query.get('payoutStatus');
    const matching = rows.filter((row) => statuses.includes(row.status)
      && (!search || [row.number, row.title, row.name, row.customer?.name ?? ''].some((value) => value.toLowerCase().includes(search)))
      && (!payout || row.payoutStatus === payout));
    const page = Number(query.get('page'));
    return { items: matching.slice((page - 1) * 20, page * 20).map((row) => ({ ...row })), total: matching.length, page, pages: Math.ceil(matching.length / 20) };
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
  const findRow = (id) => rowNodes().find((node) => node.props.row.id === id);
  render();
  return {
    rows, requests, replacements, rowNodes, findRow, nodes, render, settle,
    get params() { return params; },
    get text() { return ADMIN_TEXT[lang]; },
    get pager() { return nodes().find((node) => node.type === Pagination); },
    get loading() { return nodes().some((node) => node.props?.role === 'status' && node.props.children === ADMIN_TEXT[lang].loading); },
    navigate(href) { router.replace(href); return render(); },
  };
}

test('50 mixed records paginate 20 / 20 / 10 through real list navigation', async () => {
  const list = createList('tab=sell&state=all');
  await list.settle();
  assert.equal(list.rowNodes().length, 20);
  assert.equal(list.pager.props.pages, 3);
  list.pager.props.onPage(2);
  list.render();
  assert.equal(list.rowNodes().length, 0, 'old rows disappear before the next page arrives');
  await list.settle();
  assert.equal(list.rowNodes().length, 20);
  assert.equal(list.rowNodes()[0].props.row.id, 'fixture-21');
  list.pager.props.onPage(3);
  list.render();
  await list.settle();
  assert.equal(list.rowNodes().length, 10);
  assert.equal(list.rowNodes()[0].props.row.id, 'fixture-41');
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
  const list = createList('tab=furniture&state=completed&page=2&q=Fixture&payoutStatus=pending');
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
  assert.equal(list.params.get('state'), 'completed');
  assert.equal(list.params.get('q'), 'Fixture');
  assert.equal(list.params.get('payoutStatus'), 'pending');
  await list.settle();
  assert.equal(list.rowNodes().length, 20);
});

for (const tab of ['sell', 'furniture', 'movers', 'technicians', 'pickup', 'recovery']) {
  test(`${tab} keeps its expanded row after saving and shows terminal history without follow-up inputs`, async () => {
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
    assert.equal(completed.props.open, true);
    const html = renderToStaticMarkup(completed);
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

test('search submit resets the page and retains the selected state and payout filter', async () => {
  const list = createList('tab=furniture&state=completed&page=2&payoutStatus=pending');
  list.rows.forEach((row) => { row.status = 'delivered'; });
  await list.settle();
  const input = list.nodes().find((node) => node.type === 'input');
  input.props.onChange({ target: { value: '  Fixture  ' } });
  list.render();
  list.nodes().find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  list.render();
  assert.equal(list.params.get('page'), null);
  assert.equal(list.params.get('q'), 'Fixture');
  assert.equal(list.params.get('state'), 'completed');
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
