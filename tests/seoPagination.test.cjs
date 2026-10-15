const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, URLSearchParams, require(id) {
    assert.ok(id in dependencies, `Unexpected dependency: ${id}`);
    return dependencies[id];
  } });
  return exports;
}
const params = load('src/lib/listingParams.ts');
test('pagination normalizes malformed input and preserves unique page URLs', () => {
  for (const value of ['-2', '1.5', 'Infinity', '1e30', ['2']]) assert.equal(params.blogParams({ page: value }).page, 1);
  assert.equal(params.blogParams({ page: '2', q: ' chair ' }).q, 'chair');
  assert.equal(params.blogPagePath('/en/blog', 2), '/en/blog?page=2');
  assert.equal(params.blogPagePath('/en/blog', 1), '/en/blog');
});
test('descriptions without spaces still fit the clipping limit', () => {
  const { clip } = load('src/lib/seo/metadata.ts', { '@/lib/api': {}, './config': {} });
  assert.equal(clip('x'.repeat(200)).length, 160);
  assert.equal(clip('Short description'), 'Short description');
});
for (const category of [false, true]) {
  test(`${category ? 'category' : 'index'} renders page two with a matching canonical and rejects out-of-range pages`, async () => {
    const calls = [];
    const t = (key) => key;
    t.has = () => false;
    t.rich = key => key;
    const routes = { blog: '/blog', home: '', blogCategory: c => `/blog/category/${c}` };
    const dependencies = {
      'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
      'next/navigation': { notFound: () => { throw new Error('404'); } },
      'next-intl': { NextIntlClientProvider: 'Provider' },
      'next-intl/server': { getTranslations: async () => t, setRequestLocale() {}, getMessages: async () => ({ blog: {}, nav: {} }) },
      '@/components/Breadcrumbs': { Breadcrumbs: 'Breadcrumbs' },
      '@/components/blog/BlogBrowser': { BlogList: 'BlogList' },
      '@/i18n/navigation': { Link: 'Link' },
      '@/lib/api': { getBlog: async (locale, p) => { calls.push(p); return { items: [{ slug: 'older-post' }], total: 51, page: p.page, pages: 2 }; }, getSettings: async () => ({}), sellToUsOn: () => false },
      '@/lib/listingParams': params,
      '@/lib/seo/config': { routes, BLOG_CATEGORIES: ['guides'] },
      '@/lib/seo/jsonld': { collectionSchema: () => [], breadcrumbSchema: () => ({}), JsonLd: 'JsonLd' },
      '@/lib/seo/metadata': { pageMetadata: input => input },
    };
    const file = category ? 'src/app/[locale]/blog/category/[category]/page.tsx' : 'src/app/[locale]/blog/page.tsx';
    const page = load(file, dependencies);
    const props = { params: Promise.resolve({ locale: 'en', category: 'guides' }), searchParams: Promise.resolve({ page: '2' }) };
    const meta = await page.generateMetadata(props);
    assert.equal(meta.path, category ? '/blog/category/guides?page=2' : '/blog?page=2');
    const tree = await page.default(props);
    assert.ok(JSON.stringify(tree).includes('older-post'));
    assert.ok(calls.every(p => p.page === 2));
    assert.equal((await page.generateMetadata({ ...props, searchParams: Promise.resolve({ q: 'chair' }) })).noindex, true);
    await assert.rejects(page.default({ ...props, searchParams: Promise.resolve({ page: '3' }) }), /404/);
  });
}
test('sitemap discovers categories independently of the newest global posts', async () => {
  const { default: sitemap } = load('src/app/sitemap.ts', {
    '@/content/areas': { AREA_SLUGS: [] },
    '@/lib/api': {
      getCategories: async () => [], getAllProducts: async () => [], getSettings: async () => ({}), getBlogSitemap: async () => [], servicesOn: () => ({}),
      getBlog: async (locale, { category }) => ({ items: category === 'guides' ? [{ publishedAt: '2025-01-01', category: 'guides' }] : [] }),
    },
    '@/lib/seo/config': { BLOG_CATEGORIES: ['selling', 'guides'], DEFAULT_LOCALE: 'en', HREFLANG: { en: 'en-AE', ar: 'ar-AE' }, LOCALES: ['en', 'ar'], PUBLIC_STATIC_PATHS: [], routes: { home: '', store: '/store', blogCategory: c => `/blog/category/${c}` } },
    '@/lib/seo/metadata': { siteUrl: (locale, path) => `https://example.test/${locale}${path}` },
  });
  const entries = await sitemap();
  assert.equal(entries.length, 2);
  assert.ok(entries.every(e => e.url.endsWith('/blog/category/guides')));
});
