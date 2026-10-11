const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

/** Execute the actual components' hooks and callbacks against queued local responses only. */
function createHarness(name = 'Disputes', { query = 'tab=all&status=all', lang = 'en', props = {} } = {}) {
  const cache = new Map();
  const hooks = [];
  const requests = [];
  const replacements = [];
  let params = new URLSearchParams(query);
  let cursor = 0;
  let executing = false;
  let dirty = true;
  let effects = [];
  let tree;
  let context;
  class AdminApiError extends Error {
    constructor(status, message) { super(message); this.status = status; }
  }
  const same = (a, b) => a && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const hookReact = {
    ...React,
    useState(initial) {
      if (!executing) return React.useState(initial);
      const index = cursor++;
      hooks[index] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [hooks[index].value, (value) => {
        const next = typeof value === 'function' ? value(hooks[index].value) : value;
        if (!Object.is(next, hooks[index].value)) { hooks[index].value = next; dirty = true; }
      }];
    },
    useEffect(effect, dependencies) {
      if (!executing) return React.useEffect(effect, dependencies);
      const index = cursor++;
      if (!same(hooks[index]?.dependencies, dependencies)) {
        const previous = hooks[index];
        hooks[index] = { dependencies, cleanup: previous?.cleanup };
        effects.push(() => { previous?.cleanup?.(); hooks[index].cleanup = effect(); });
      }
    },
  };
  const router = { replace(href) {
    replacements.push(href);
    params = new URL(href, 'https://fixture.local').searchParams;
    dirty = true;
  } };
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const expose = file.endsWith('/disputes/page.tsx') ? '\nexports.Disputes = Disputes; exports.DisputeCard = DisputeCard;' : '';
    vm.runInNewContext(compiled + expose, {
      exports, Intl, URLSearchParams, AbortController, Event,
      window: { dispatchEvent() {} },
      require: (id) => {
        if (id === 'react') return hookReact;
        if (id.endsWith('/AdminShell')) return { useAdmin: () => context };
        if (id === 'next/navigation') return { useSearchParams: () => params, useRouter: () => router };
        if (id === 'next/link') return { __esModule: true, default: ({ children, ...attributes }) => React.createElement('a', attributes, children) };
        if (id === '@/lib/adminApi') return {
          AdminApiError,
          adminErrorText: (err, fallback) => err instanceof AdminApiError ? err.message : fallback,
          adminFetch: (apiPath, init = {}) => new Promise((resolve, reject) => {
            assert.ok(apiPath.startsWith('/admin/disputes'), 'the fixture never touches order or financial endpoints');
            requests.push({ path: apiPath, init, resolve, reject, settled: false });
          }),
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
  const { ORDER_SOURCE_TYPES } = load('src/app/admin/orderTabs.ts');
  const { Pagination } = load('src/app/admin/Pagination.tsx');
  const page = load('src/app/admin/disputes/page.tsx');
  const { DisputeForm } = load('src/app/admin/orders/DisputeForm.tsx');
  const component = name === 'DisputeForm' ? DisputeForm : page[name];
  context = { t: ADMIN_TEXT[lang], lang, admin: { role: 'staff' } };
  const tabs = Object.keys(ORDER_SOURCE_TYPES);
  const rows = Array.from({ length: 50 }, (_, index) => {
    const tab = tabs[index % tabs.length];
    const status = index < 21 ? 'open' : 'resolved';
    return {
      id: (index + 1).toString(16).padStart(24, '0'), number: `DS-${String(index + 1).padStart(6, '0')}`, status,
      reason: 'Fixture disputed condition', resolutionNote: status === 'resolved' ? 'Fixture agreed resolution' : '',
      createdAt: '2026-10-01T10:00:00Z', updatedAt: '2026-10-01T10:00:00Z',
      createdBy: { id: '000000000000000000000001', name: 'Mona' },
      history: [{ status: 'open', at: '2026-10-01T10:00:00Z', by: { id: '000000000000000000000001', name: 'Mona' }, note: 'Fixture disputed condition' }],
      source: { type: ORDER_SOURCE_TYPES[tab], tab, id: (index + 101).toString(16).padStart(24, '0'),
        number: `${tab === 'furniture' ? 'OR' : tab === 'sell' ? 'SR' : tab.toUpperCase()}-${String(index + 1).padStart(6, '0')}`,
        status: tab === 'furniture' ? 'delivered' : tab === 'sell' ? 'listed' : 'completed', exists: true,
        title: 'Fixture sofa or service', name: 'Fixture contact', phone: '0500000000' },
    };
  });
  function render() {
    let attempts = 0;
    while (dirty) {
      assert.ok(attempts++ < 20, 'the real component settles without a render loop');
      dirty = false; cursor = 0; executing = true;
      try { tree = component(props); } finally { executing = false; }
      const pending = effects; effects = []; pending.forEach((effect) => effect());
    }
    return tree;
  }
  const nodes = (node = tree) => !node || typeof node !== 'object' ? [] : [node, ...[].concat(node.props?.children || []).flatMap((child) => nodes(child))];
  function response(request) {
    assert.equal(request.init.method ?? 'GET', 'GET', 'mutations need an explicit synthetic response');
    const query = new URL(request.path, 'https://fixture.local').searchParams;
    const search = (query.get('q') ?? '').toLowerCase();
    const matching = rows.filter((row) => (!query.get('status') || row.status === query.get('status'))
      && (!query.get('sourceType') || row.source.type === query.get('sourceType'))
      && (!query.get('sourceId') || row.source.id === query.get('sourceId'))
      && (!search || [row.number, row.reason, row.source.number, row.source.title, row.source.name].some((value) => value.toLowerCase().includes(search))));
    const page = Number(query.get('page') ?? 1), limit = Number(query.get('limit') ?? 20);
    return { items: matching.slice((page - 1) * limit, page * limit).map((row) => ({ ...row })), total: matching.length, page, pages: Math.max(1, Math.ceil(matching.length / limit)) };
  }
  async function settle(request = requests.find((entry) => !entry.settled), { value, error } = {}) {
    assert.ok(request, 'a local request is pending');
    request.settled = true;
    if (error) request.reject(error);
    else request.resolve(value === undefined ? response(request) : value);
    await new Promise((resolve) => setImmediate(resolve));
    return render();
  }
  render();
  return {
    rows, requests, replacements, AdminApiError, render, settle, nodes,
    get params() { return params; }, get text() { return ADMIN_TEXT[lang]; },
    get cards() { return nodes().filter((node) => node.props?.dispute); },
    get pager() { return nodes().find((node) => node.type === Pagination); },
    get html() { return renderToStaticMarkup(tree); },
    get typeLinks() { const nav = nodes().find((node) => node.props?.view === 'disputes'); return nodes(nav?.type(nav.props)).filter((node) => node.props?.href); },
    navigate(href) { router.replace(href); return render(); },
    setProps(next) { props = next; dirty = true; return render(); },
  };
}

test('50 all-status cases paginate without duplication and disputes offer all six service types', async () => {
  for (const lang of ['en', 'ar']) {
    const list = createHarness('Disputes', { lang });
    const apiQuery = new URL(list.requests[0].path, 'https://fixture.local').searchParams;
    assert.equal(apiQuery.get('status'), null, 'All is represented by the absent BE status filter');
    assert.equal(apiQuery.get('sourceType'), null);
    assert.deepEqual(list.typeLinks.map((node) => new URL(node.props.href, 'https://fixture.local').searchParams.get('tab')), ['all', 'sell', 'furniture', 'movers', 'technicians', 'pickup', 'recovery']);
    await list.settle();
    const ids = list.cards.map((node) => node.props.dispute.id);
    assert.equal(ids.length, 20);
    for (const page of [2, 3]) {
      list.pager.props.onPage(page); list.render();
      assert.equal(list.cards.length, 0, 'prior-page cases disappear during load');
      await list.settle();
      assert.equal(list.cards.length, page === 2 ? 20 : 10);
      ids.push(...list.cards.map((node) => node.props.dispute.id));
    }
    assert.equal(new Set(ids).size, 50);
  }
});

test('resolving the last open case on page two recovers page one without losing its filters', async () => {
  const list = createHarness('Disputes', { query: 'tab=all&status=open&page=2&q=Fixture' });
  await list.settle();
  assert.equal(list.cards.length, 1);
  const row = list.cards[0];
  const card = createHarness('DisputeCard', { props: { ...row.props, open: true } });
  card.nodes().find((node) => node.type === 'textarea').props.onChange({ target: { value: '  Agreed fixture resolution  ' } });
  card.render();
  const submission = card.nodes().find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(JSON.parse(card.requests[0].init.body), { resolutionNote: 'Agreed fixture resolution' });
  list.rows[20].status = 'resolved';
  await card.settle(card.requests[0], { value: { ...list.rows[20] } });
  await submission; list.render();
  assert.equal(list.cards.length, 0);
  await list.settle();
  assert.equal(list.params.get('page'), null);
  assert.equal(list.params.get('status'), 'open');
  assert.equal(list.params.get('tab'), 'all');
  assert.equal(list.params.get('q'), 'Fixture');
  await list.settle();
  assert.equal(list.cards.length, 20);
  assert.ok(list.cards.every((node) => node.props.dispute.status === 'open'));
});

test('a concurrent resolve conflict refreshes the stale open case with an already-resolved message', async () => {
  const list = createHarness('Disputes', { query: 'tab=all&status=all&q=DS-000001' });
  await list.settle();
  const card = createHarness('DisputeCard', { props: list.cards[0].props });
  card.nodes().find((node) => node.type === 'textarea').props.onChange({ target: { value: 'Checked with customer' } });
  card.render();
  const submission = card.nodes().find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  list.rows[0].status = 'resolved';
  await card.settle(card.requests[0], { error: new card.AdminApiError(409, 'Already resolved remotely') });
  await submission; list.render();
  assert.equal(list.cards.length, 0, 'the obsolete Open card hides before reloading');
  assert.ok(list.nodes().some((node) => node.props?.role === 'status' && node.props.children === list.text.disputeAlreadyResolved));
  await list.settle();
  assert.equal(list.cards[0].props.dispute.status, 'resolved');
  assert.equal(list.cards[0].props.open, true);
  assert.doesNotMatch(renderToStaticMarkup(list.cards[0]), /<form\b|<textarea\b/);
});

test('an aborted dispute filter response cannot show old cases or clamp the newly selected page', async () => {
  const list = createHarness('Disputes', { query: 'tab=sell&status=open&page=9' });
  const stale = list.requests[0];
  list.navigate('/admin/disputes?tab=all&status=all&page=2');
  await list.settle(stale);
  assert.equal(stale.init.signal.aborted, true);
  assert.equal(list.cards.length, 0);
  assert.equal(list.params.get('page'), '2');
  assert.equal(list.replacements.length, 1);
  await list.settle();
  assert.equal(list.cards.length, 20);
});

test('expanded dispute cards link to the current active, cancelled, accepted or completed source and handle removal', () => {
  const sample = createHarness().rows[0];
  for (const lang of ['en', 'ar']) {
    for (const [type, tab, status, targetPath, state] of [
      ['order', 'furniture', 'confirmed', '/admin/sold-orders', null],
      ['order', 'furniture', 'delivered', '/admin/completed-orders', null],
      ['sell_request', 'sell', 'listed', '/admin/orders', 'completed'],
      ['sell_request', 'sell', 'rejected', '/admin/cancelled-orders', null],
      ['move', 'movers', 'completed', '/admin/completed-orders', null],
      ['car_recovery', 'recovery', 'cancelled', '/admin/cancelled-orders', null],
    ]) {
      const source = { ...sample.source, type, tab, status, number: 'SR + 1/2?&اسم' };
      const card = createHarness('DisputeCard', { lang, props: { dispute: { ...sample, source }, open: true, onToggle() {}, onChanged() {} } });
      const link = card.nodes().find((node) => node.props?.href);
      const url = new URL(link.props.href, 'https://fixture.local');
      assert.equal(url.pathname, targetPath);
      assert.equal(url.searchParams.get('tab'), tab);
      assert.equal(url.searchParams.get('state'), state);
      assert.equal(url.searchParams.get('q'), source.number);
      card.setProps({ dispute: { ...sample, source: { ...source, exists: false } }, open: true, onToggle() {}, onChanged() {} });
      assert.equal(card.nodes().some((node) => node.props?.href), false);
      assert.ok(card.html.includes(card.text.sourceMissing));
    }
  }
});

test('opening an existing dispute never offers a second form and failed lookup offers a retry', async () => {
  const sample = createHarness().rows[0];
  const form = createHarness('DisputeForm', { props: { row: { id: sample.source.id }, tab: sample.source.tab, onChanged() {} } });
  assert.equal(form.nodes().some((node) => node.type === 'form'), false, 'no duplicate form appears during lookup');
  await form.settle(undefined, { error: new Error('Local lookup failed') });
  assert.ok(form.nodes().some((node) => node.props?.role === 'alert'));
  form.nodes().find((node) => node.type === 'button').props.onClick(); form.render();
  await form.settle();
  assert.equal(form.nodes().some((node) => node.type === 'form'), false);
  const link = form.nodes().find((node) => node.props?.href);
  assert.equal(new URL(link.props.href, 'https://fixture.local').searchParams.get('q'), sample.number);
});

test('a duplicate-create conflict rechecks the case without changing fulfilment or accounting', async () => {
  const sample = createHarness().rows[0];
  const form = createHarness('DisputeForm', { props: { row: { id: sample.source.id }, tab: sample.source.tab, onChanged() { assert.fail('duplicate creation is not a successful creation'); } } });
  await form.settle(undefined, { value: { items: [] } });
  form.nodes().find((node) => node.type === 'button').props.onClick(); form.render();
  form.nodes().find((node) => node.type === 'textarea').props.onChange({ target: { value: '  Fixture condition mismatch  ' } }); form.render();
  const submission = form.nodes().find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  const post = form.requests.at(-1);
  assert.equal(post.init.method, 'POST');
  assert.deepEqual(JSON.parse(post.init.body), { sourceType: sample.source.type, sourceId: sample.source.id, reason: 'Fixture condition mismatch' });
  await form.settle(post, { error: new form.AdminApiError(409, 'Duplicate') });
  await submission; form.render();
  assert.equal(form.nodes().some((node) => node.type === 'form'), false, 'recheck hides the obsolete editor');
  await form.settle();
  assert.equal(form.nodes().some((node) => node.type === 'form'), false);
  assert.ok(form.nodes().some((node) => node.props?.href));
  assert.equal(form.requests.filter((entry) => entry.init.method === 'POST').length, 1);
  assert.ok(form.requests.every((entry) => entry.path.startsWith('/admin/disputes')));
});
