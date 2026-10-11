const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function fixture(query = '', lang = 'en', view = 'listed') {
  const cache = new Map(), hooks = [], calls = [], replacements = [];
  let cursor = 0, running = false, dirty = true, tree, effects = [], params = new URLSearchParams(query), context;
  let refreshOk = true, refreshes = 0;
  const hookReact = { ...React,
    useState(initial) {
      if (!running) return React.useState(initial);
      const index = cursor++; hooks[index] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [hooks[index].value, value => { const next = typeof value === 'function' ? value(hooks[index].value) : value; if (!Object.is(next, hooks[index].value)) { hooks[index].value = next; dirty = true; } }];
    },
    useRef(initial) { const index = cursor++; hooks[index] ??= { current: initial }; return hooks[index]; },
    useEffect(effect, deps) {
      if (!running) return React.useEffect(effect, deps);
      const index = cursor++, previous = hooks[index];
      if (!previous || deps.some((dep, i) => !Object.is(dep, previous.deps[i]))) {
        hooks[index] = { deps, cleanup: previous?.cleanup };
        effects.push(() => { previous?.cleanup?.(); hooks[index].cleanup = effect(); });
      }
    },
  };
  const router = { replace(href) { replacements.push(href); params = new URL(href, 'https://fixture.test').searchParams; dirty = true; } };
  function load(file) {
    file = path.resolve(file); if (cache.has(file)) return cache.get(file);
    const exports = {}; cache.set(file, exports);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    vm.runInNewContext(code, { exports, URLSearchParams, AbortController, Event, window: { dispatchEvent() {} }, require(id) {
      if (id === 'react') return hookReact;
      if (id.endsWith('/AdminShell')) return { useAdmin: () => context };
      if (id === 'next/navigation') return { usePathname: () => view === 'listed' ? '/admin/listed-items' : '/admin/products', useRouter: () => router, useSearchParams: () => params };
      if (id === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
      if (id === '@/lib/adminApi') return {
        adminErrorText: error => error.message,
        refreshPublicStore: async () => { refreshes++; return refreshOk; },
        adminFetch(apiPath, init = {}) { return new Promise((resolve, reject) => calls.push({ path: apiPath, init, resolve, reject, settled: false })); },
      };
      if (!id.startsWith('.') && !id.startsWith('@/')) return require(id);
      const base = id.startsWith('@/') ? `src/${id.slice(2)}` : path.resolve(path.dirname(file), id);
      return load(['.ts', '.tsx'].map(ext => base + ext).find(fs.existsSync));
    } }); return exports;
  }
  const { ADMIN_TEXT } = load('src/app/admin/i18n.ts'); context = { t: ADMIN_TEXT[lang], lang };
  const { ProductList } = load('src/app/admin/products/ProductList.tsx');
  function render() { let n = 0; while (dirty) { assert.ok(n++ < 30, 'render loop'); dirty = false; cursor = 0; running = true; tree = ProductList({ view }); running = false; const work = effects; effects = []; work.forEach(fn => fn()); } }
  async function flush() { for (let i = 0; i < 8; i++) { await Promise.resolve(); render(); } }
  function nodes(node) { if (node == null || typeof node !== 'object') return []; if (Array.isArray(node)) return node.flatMap(child => nodes(child)); return [node, ...nodes(node.props?.children)]; }
  function button(label) { const matches = nodes(tree).filter(n => n.type === 'button' && (n.props['aria-label'] === label || n.props.children === label)); assert.equal(matches.length, 1, label); return matches[0]; }
  function queryCall() { return calls.find(c => !c.settled && c.path.startsWith('/admin/products?')); }
  async function settle(call, value) { assert.ok(call, 'request exists'); call.settled = true; call.resolve(value); await flush(); }
  async function loadRows(rows) { const c = queryCall(), u = new URL(c.path, 'https://fixture.test'), statuses = u.searchParams.get('status')?.split(','); const filtered = rows.filter(row => !statuses || statuses.includes(row.status)); const page = Number(u.searchParams.get('page')); await settle(c, { items: filtered.slice((page-1)*20,page*20), total: filtered.length, page, pages: Math.ceil(filtered.length/20) }); }
  render();
  return { calls, replacements, flush, loadRows, settle, queryCall, button, nodes: () => nodes(tree), async choose(title, status) { const select = nodes(tree).find(n => n.type === 'select' && n.props['aria-label'] === `${context.t.listedItemCopy.changeStatus}: ${title}`); assert.ok(select); select.props.onChange({ target: { value: status } }); await flush(); }, html: () => renderToStaticMarkup(tree), navigate(query) { params = new URLSearchParams(query); dirty = true; render(); }, failRefresh() { refreshOk = false; }, allowRefresh() { refreshOk = true; }, get refreshes() { return refreshes; }, copy: context.t.listedItemCopy };
}
const product = (status, id = status) => ({ id, status, title: `${id} item`, ref: `HL-${id}`, slug: id, photos: [], price: 0, currency: 'AED', inspected: true });

test('listed items show only visible products, including legacy filter links, in English and Arabic', async () => {
  const rows = ['active', 'archived', 'expired', 'reserved', 'sold', 'draft'].map(status => product(status));
  for (const lang of ['en', 'ar']) {
    for (const filter of ['', 'visibility=hidden', 'visibility=reserved', 'visibility=sold', 'visibility=all', 'status=sold']) {
      const f = fixture(`${filter}&q=item&category=aaaaaaaaaaaaaaaaaaaaaaaa`, lang);
      const requested = new URL(f.queryCall().path, 'https://fixture.test').searchParams;
      assert.equal(requested.get('status'), 'active');
      assert.equal(requested.get('q'), 'item');
      assert.equal(requested.get('category'), 'aaaaaaaaaaaaaaaaaaaaaaaa');
      await f.loadRows(rows);
      for (const status of rows.map(r => r.status)) assert.equal(f.html().includes(`>${status} item<`), status === 'active', `${lang}/${filter}/${status}`);
      assert.doesNotMatch(f.html(), /role="tablist"|<button[^>]*>(Hidden|Reserved|Sold|All items|مخفي|محجوز|مباع|جميع المنتجات)<\/button>/);
      assert.ok(f.html().includes(`href="/admin/products"`));
      assert.ok(f.html().includes(f.copy.catalogLink));
      if (filter) {
        const normalized = new URL(f.replacements.at(-1), 'https://fixture.test').searchParams;
        assert.equal(normalized.has('visibility'), false);
        assert.equal(normalized.has('status'), false);
        assert.equal(normalized.get('q'), 'item');
        assert.equal(normalized.get('category'), 'aaaaaaaaaaaaaaaaaaaaaaaa');
      }
    }
  }
});

test('admins explicitly save visible, hidden, reserved and sold status with stale-edit protection', async () => {
  for (const lang of ['en','ar']) {
    const f = fixture('', lang, 'catalog'), row = product('active','sofa'); await f.loadRows([row]);
    for (const status of ['archived','active','reserved','sold','active']) {
      const previous = row.status; await f.choose(row.title, status);
      const action = f.button(`${f.copy.saveStatus}: ${row.title}`).props.onClick(); await f.flush();
      f.button(`${f.copy.saveStatus}: ${row.title}`).props.onClick();
      const writes = f.calls.filter(c => c.init.method === 'POST' && !c.settled); assert.equal(writes.length,1);
      assert.equal(writes[0].path,'/admin/products/sofa/status'); assert.deepEqual(JSON.parse(writes[0].init.body),{status,expectedStatus:previous});
      row.status = status; await f.settle(writes[0],row); await action; await f.flush(); await f.loadRows([row]);
    }
    assert.equal(f.refreshes,5);
  }
});

test('failed save reports the error and does not refresh public pages', async () => {
  const f = fixture(); await f.loadRows([product('active')]); await f.choose('active item','archived');
  const action = f.button('Save status: active item').props.onClick();
  const save = f.calls.find(c => c.init.method === 'POST'); save.settled = true; save.reject(new Error('Item changed meanwhile')); await action; await f.flush(); await f.loadRows([product('reserved')]);
  assert.match(f.html(), /Item changed meanwhile/); assert.equal(f.refreshes,0);
});

test('cache retry does not repeat a saved status mutation', async () => {
  const f = fixture(); f.failRefresh(); await f.loadRows([product('active')]); await f.choose('active item','archived');
  const action = f.button('Save status: active item').props.onClick(); await f.settle(f.calls.find(c => c.init.method === 'POST'),product('archived')); await action; await f.flush(); await f.loadRows([]);
  assert.ok(f.html().includes(f.copy.refreshWarning)); f.allowRefresh(); await f.button(f.copy.retryRefresh).props.onClick(); await f.flush();
  assert.equal(f.refreshes,2); assert.equal(f.calls.filter(c => c.init.method === 'POST').length,1);
});

test('old filter responses cannot replace current results', async () => {
  const f = fixture('', 'en', 'catalog'), old = f.queryCall(); f.navigate('status=reserved'); await f.settle(f.calls.find(c => c !== old && c.path.startsWith('/admin/products?')),{items:[product('reserved')],total:1,page:1,pages:1});
  await f.settle(old,{items:[product('active')],total:1,page:1,pages:1}); assert.match(f.html(), /reserved item/); assert.doesNotMatch(f.html(), /active item/);
});

test('changing the last matching item recovers pagination', async () => {
  const f = fixture('page=2'), rows = Array.from({length:21},(_,i) => product('active',String(i))); await f.loadRows(rows); await f.choose('20 item','archived');
  const action = f.button('Save status: 20 item').props.onClick(); rows[20].status='archived'; await f.settle(f.calls.find(c => c.init.method === 'POST'),rows[20]); await action; await f.flush(); await f.loadRows(rows);
  assert.equal(new URL(f.replacements.at(-1),'https://fixture.test').searchParams.get('page'),null); await f.loadRows(rows); assert.match(f.html(), /0 item/);
});

test('expired and draft items can be set visible, and catalog exposes sold filter', async () => {
  for (const [query,status,view] of [['status=expired','expired','catalog'],['status=draft','draft','catalog'],['status=sold','sold','catalog']]) {
    const f=fixture(query,'en',view); await f.loadRows([product(status)]); assert.match(f.html(),new RegExp(`>${status} item<`)); await f.choose(`${status} item`,'active'); assert.equal(f.button(`Save status: ${status} item`).props.disabled,false);
    if (status === 'sold') assert.match(f.html(), /href="\/admin\/products\?view=manage&amp;status=sold&amp;q=HL-sold"/);
  }
});

test('admins retain status controls alongside legacy buyer reservation links', async () => {
  const f=fixture('status=reserved', 'en', 'catalog'); await f.loadRows([{...product('reserved'),orderId:'buyer-order'}]);
  assert.match(f.html(),/Manage buyer order/); assert.match(f.html(),/aria-label="Item status:/);
  await f.choose("reserved item", "archived");
  assert.equal(f.button("Save status: reserved item").props.disabled, false);
});

test('hiding, reserving or selling an item removes it from listed items after saving', async () => {
  for (const status of ['archived', 'reserved', 'sold']) {
    const f = fixture(), row = product('active', 'sofa'); await f.loadRows([row]);
    await f.choose(row.title, status);
    const action = f.button(`Save status: ${row.title}`).props.onClick();
    row.status = status;
    await f.settle(f.calls.find(c => c.init.method === 'POST'), row); await action; await f.flush();
    assert.equal(new URL(f.queryCall().path, 'https://fixture.test').searchParams.get('status'), 'active');
    await f.loadRows([row]);
    assert.ok(f.html().includes(f.copy.empty));
    assert.doesNotMatch(f.html(), />sofa item</);
  }
});

test('item buckets enforce their own status even with contradictory links and preserve search and category', async () => {
  const rows = ['active', 'reserved', 'sold', 'disputed', 'archived'].map(status => product(status));
  for (const [view, status] of [['listed','active'],['reserved','reserved']]) {
    const f = fixture('status=active&q=item&category=aaaaaaaaaaaaaaaaaaaaaaaa', 'en', view);
    await f.loadRows(rows);
    const u = new URL(f.queryCall()?.path || f.calls.find(c => c.path.startsWith('/admin/products?')).path, 'https://fixture.test');
    assert.equal(u.searchParams.get('status'), status);
    assert.equal(u.searchParams.get('q'), 'item');
    assert.equal(u.searchParams.get('category'), 'aaaaaaaaaaaaaaaaaaaaaaaa');
    assert.match(f.html(), new RegExp(`>${status} item<`));
    if (status !== 'active') assert.doesNotMatch(f.html(), />active item</);
  }
});

test('legacy problem holds remain recoverable under Hidden without a second dispute status action', async () => {
  const f = fixture('view=manage&status=archived', 'en', 'catalog');
  const row = {...product('disputed', 'damaged-sofa'), problemReason:'Seller reported damaged legs'};
  await f.loadRows([row, product('archived'), product('active')]);
  assert.match(f.html(), />damaged-sofa item</);
  assert.match(f.html(), /Seller reported damaged legs/);
  assert.doesNotMatch(f.html(), />active item<|Item problems|Problem \/ dispute|value="disputed"[^>]*>Problem/);
  await f.choose(row.title, 'active');
  const action = f.button(`Save status: ${row.title}`).props.onClick();
  const call = f.calls.find(c => c.init.method === 'POST');
  assert.deepEqual(JSON.parse(call.init.body), {status:'active', expectedStatus:'disputed'});
  row.status = 'active'; await f.settle(call, row); await action; await f.flush(); await f.loadRows([row]);
  assert.doesNotMatch(f.html(), />damaged-sofa item</);
});
