const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

// Load pure server helpers without starting Next or making API requests.
const cache = {};
const api = {
  shopEnabled: s => s?.shop?.enabled !== false,
  sellToUsOn: s => s?.sellToUs?.enabled !== false,
  servicesOn: s => ({ store: s?.shop?.enabled !== false, sellToUs: s?.sellToUs?.enabled !== false, listWithUs: s?.listWithUs?.enabled !== false, moving: !!s?.moving?.enabled, technician: !!s?.technician?.enabled }),
};
function load(file) {
  if (cache[file]) return cache[file];
  const exports = cache[file] = {};
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  vm.runInNewContext(output, { exports, process, require: id => {
    if (id === '@/lib/api') return api;
    if (id === 'react/jsx-runtime') return {};
    if (!id.startsWith('@/') && !id.startsWith('.')) return require(id);
    let resolved = id.startsWith('@/') ? `src/${id.slice(2)}` : path.resolve(path.dirname(file), id);
    if (resolved.endsWith('.json')) return JSON.parse(fs.readFileSync(resolved, 'utf8'));
    resolved = ['.ts', '.tsx'].map(ext => resolved + ext).find(fs.existsSync);
    assert.ok(resolved, `Unresolved dependency ${id}`);
    return load(resolved);
  }});
  return exports;
}
const { homeTitle, homeDescription } = load('src/lib/seo/metadata.ts');
const { organizationSchema, listingServiceSchema } = load('src/lib/seo/jsonld.tsx');
const { pageFor } = load('src/content/pages.ts');
const { listingTerms } = load('src/lib/listing.ts');
const { formatLlms, formatLlmsFull } = load('src/lib/seo/llms.ts');
const settings = { shop: { enabled: false }, sellToUs: { enabled: false }, listWithUs: { enabled: true }, listing: { days: 45, commissionPercent: 12.5 }, moving: { enabled: false }, technician: { enabled: false } };

for (const locale of ['en', 'ar']) {
  test(`${locale}: listing-only headlines, About and AI summaries agree with current settings`, () => {
    const messages = JSON.parse(fs.readFileSync(`src/messages/${locale}.json`, 'utf8'));
    const t = key => messages.meta.home[key];
    assert.equal(homeTitle(t, settings), t('titleList'));
    assert.equal(homeDescription(t, settings), t('descriptionSellList'));
    const about = pageFor('about', locale, api.servicesOn(settings));
    assert.ok(about.sections.length >= 4);
    const text = JSON.stringify(about);
    assert.doesNotMatch(text, locale === 'en' ? /cash offer|online store offers|Our moving service|Our technician service/ : /عرضاً نقدياً|يعرض متجرنا|تشمل خدمة النقل|تشمل خدمة الفنيين/);
    assert.match(text, locale === 'en' ? /sale is not guaranteed/ : /البيع غير مضمون/);
    const disabledListing = pageFor('about', locale, api.servicesOn({ ...settings, listWithUs: { enabled: false }, sellToUs: { enabled: true } }));
    assert.doesNotMatch(JSON.stringify(disabledListing), locale === 'en' ? /List your used|You keep ownership/ : /اعرض أثاثك|تبقى القطعة ملكك/);
  });
}
test('home titles and descriptions track all store, buyout, moving and technician combinations', () => {
  for (let mask = 0; mask < 16; mask++) {
    const s = { ...settings, shop: { enabled: !!(mask & 1) }, sellToUs: { enabled: !!(mask & 2) }, moving: { enabled: !!(mask & 4) }, technician: { enabled: !!(mask & 8) } };
    assert.equal(homeTitle(k => k, s), s.shop.enabled ? 'title' : s.sellToUs.enabled ? 'titleSell' : 'titleList');
    const description = homeDescription(k => k, s);
    assert.equal(description.includes('servicesMoving'), s.moving.enabled && !s.technician.enabled);
    assert.equal(description.includes('servicesTechnician'), s.technician.enabled && !s.moving.enabled);
    assert.equal(description.includes('servicesBoth'), s.technician.enabled && s.moving.enabled);
    const org = organizationSchema('en', s);
    assert.equal(JSON.stringify(org['@type']).includes('OnlineStore'), s.shop.enabled);
    assert.equal(org.description.includes('offers technician visits'), s.technician.enabled);
    assert.equal(org.description.includes('offers home and office moving'), s.moving.enabled);
    assert.equal(org.description.includes('for cash'), s.sellToUs.enabled);
  }
});
test('listing proceeds use live terms and fail closed for invalid or disabled settings', () => {
  const terms = listingTerms(settings);
  assert.equal(terms.days, 45);
  assert.equal(terms.exampleCommission, 125);
  assert.equal(terms.exampleProceeds, 875);
  assert.equal(listingTerms({ ...settings, listWithUs: { enabled: false } }), null);
  for (const listing of [undefined, { days: 0, commissionPercent: 10 }, { days: 30, commissionPercent: NaN }, { days: 30, commissionPercent: 101 }]) {
    assert.equal(listingTerms({ ...settings, listing }), null);
  }
  const schema = listingServiceSchema('en', 'Owner listing', 'Set your price');
  assert.equal(schema.offers, undefined);
  assert.doesNotMatch(JSON.stringify(schema), /Free pickup|Buying used/);
});
test('both AI text formats expose actual terms, limits and the updated About copy', () => {
  for (const format of [formatLlms, formatLlmsFull]) {
    const text = format({ categories: [], products: [], settings, settingsAr: settings, posts: [] });
    assert.match(text, /45 days/);
    assert.match(text, /12\.5%/);
    assert.match(text, /not a guaranteed sale/);
    assert.match(text, /الإعلان لا يضمن البيع/);
    assert.doesNotMatch(text, /that buys used.*for cash/);
    assert.match(text, /#owner-listings/);
  }
});
