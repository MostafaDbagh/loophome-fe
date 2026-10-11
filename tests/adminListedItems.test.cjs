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
  return { calls, replacements, flush, loadRows, settle, queryCall, button, nodes, html: () => renderToStaticMarkup(tree), navigate(query) { params = new URLSearchParams(query); dirty = true; render(); }, failRefresh() { refreshOk = false; }, allowRefresh() { refreshOk = true; }, get refreshes() { return refreshes; }, copy: context.t.listedItemCopy };
}
const product = (status, id = status) => ({ id, status, title: `${id} item`, ref: `HL-${id}`, slug: id, photos: [], price: 0, currency: 'AED', inspected: true });

test('listed filters separate visibility and reservation while excluding sold items in both languages', async () => {
  const rows = ['active', 'archived', 'expired', 'reserved', 'sold', 'draft'].map(status => product(status));
  for (const lang of ['en', 'ar']) {
    const f = fixture('', lang); await f.loadRows(rows); assert.match(f.html(), /active item/); assert.doesNotMatch(f.html(), />reserved item<|>sold item<|>draft item</);
    for (const [filter, expected] of [['hidden',['archived','expired']],['reserved',['reserved']],['all',['active','archived','expired','reserved']]]) {
      f.button(f.copy[filter]).props.onClick(); await f.flush(); await f.loadRows(rows);
      for (const status of rows.map(r => r.status)) assert.equal(f.html().includes(`>${status} item<`), expected.includes(status), `${lang}/${filter}/${status}`);
    }
    assert.ok(!f.html().includes('>'+f.copy.sold+'</button>'));
    assert.match(f.html(), /\/admin\/completed-orders\?tab=furniture/);
  }
});

test('hide moves a live item to Hidden and show restores it, refreshing public pages after each save', async () => {
  const f = fixture(), row = product('active', 'sofa'); await f.loadRows([row]);
  const action = f.button('Hide from store: sofa item').props.onClick(); await f.flush();
  f.button('Hide from store: sofa item').props.onClick();
  const writes = f.calls.filter(c => c.init.method === 'POST'); assert.equal(writes.length, 1, 'double click cannot send two saves'); assert.equal(writes[0].path, '/admin/products/sofa/archive');
  row.status = 'archived'; await f.settle(writes[0], row); await action; await f.flush(); await f.loadRows([row]);
  assert.equal(f.refreshes, 1); assert.ok(f.html().includes(f.copy.empty));
  f.button(f.copy.hidden).props.onClick(); await f.flush(); await f.loadRows([row]);
  const show = f.button('Show in store: sofa item').props.onClick(); await f.flush();
  const publish = f.calls.find(c => c.path === '/admin/products/sofa/publish'); row.status = 'active'; await f.settle(publish, row); await show; await f.flush(); await f.loadRows([row]);
  assert.equal(f.refreshes, 2); assert.ok(f.html().includes(f.copy.empty));
});

test('a failed save cannot report success or invalidate the public store', async () => {
  const f = fixture(); await f.loadRows([product('active')]); const action = f.button('Hide from store: active item').props.onClick();
  const save = f.calls.find(c => c.init.method === 'POST'); save.settled = true; save.reject(new Error('Item is now reserved')); await action; await f.flush(); await f.loadRows([product('reserved')]);
  assert.match(f.html(), /Item is now reserved/); assert.equal(f.refreshes, 0); assert.doesNotMatch(f.html(), /is now hidden/);
});

test('cache refresh failure offers retry without replaying the product mutation', async () => {
  const f = fixture(); f.failRefresh(); await f.loadRows([product('active')]); const action = f.button('Hide from store: active item').props.onClick();
  await f.settle(f.calls.find(c => c.init.method === 'POST'), product('archived')); await action; await f.flush(); await f.loadRows([]);
  assert.ok(f.html().includes(f.copy.refreshWarning)); f.allowRefresh(); await f.button(f.copy.retryRefresh).props.onClick(); await f.flush();
  assert.equal(f.refreshes, 2); assert.equal(f.calls.filter(c => c.init.method === 'POST').length, 1); assert.ok(!f.html().includes(f.copy.refreshWarning));
});

test('old visibility responses cannot replace newer filter results', async () => {
  const f = fixture(), old = f.queryCall(); f.navigate('visibility=reserved'); await f.settle(f.calls.find(c => c !== old && c.path.startsWith('/admin/products?')), { items:[product('reserved')], total:1, page:1,pages:1 });
  await f.settle(old, { items:[product('active')], total:1,page:1,pages:1 }); assert.match(f.html(), /reserved item/); assert.doesNotMatch(f.html(), /active item/);
});

test('hiding the last item on page two recovers to page one', async () => {
  const f = fixture('page=2'), rows = Array.from({length:21}, (_,i) => product('active', String(i))); await f.loadRows(rows);
  const save = f.button('Hide from store: 20 item').props.onClick(); rows[20].status = 'archived'; await f.settle(f.calls.find(c => c.init.method === 'POST'), rows[20]); await save; await f.flush(); await f.loadRows(rows);
  assert.equal(new URL(f.replacements.at(-1),'https://fixture.test').searchParams.get('page'), null); await f.loadRows(rows); assert.match(f.html(), /0 item/);
});

test('expired items show a renewal action, and drafts remain accessible in the full catalog', async () => {
  const expired = fixture('visibility=hidden'); await expired.loadRows([product('expired')]); assert.ok(expired.button('Renew and show: expired item')); assert.match(expired.html(), /new listing period/);
  const catalog = fixture('status=draft', 'en', 'catalog'); await catalog.loadRows([product('draft')]); assert.match(catalog.html(), /draft item/); assert.ok(catalog.button('Show in store: draft item'));
});

 test('catalog All and old sold filters never request sold products', async () => {
  const rows = ['active','draft','reserved','archived','expired','sold'].map(status => product(status));
  for (const lang of ['en','ar']) for (const query of ['', 'status=sold']) {
    const f = fixture(query,lang,'catalog'); await f.loadRows(rows);
    for (const status of ['active','draft','reserved','archived','expired']) assert.match(f.html(),new RegExp('>'+status+' item<'));
    assert.doesNotMatch(f.html(), />sold item</);
  }
  const legacy = fixture('visibility=sold'); await legacy.loadRows(rows); assert.doesNotMatch(legacy.html(), />sold item</);
});
