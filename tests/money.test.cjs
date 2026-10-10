const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { renderToStaticMarkup } = require('react-dom/server');
const source = fs.readFileSync(path.join(__dirname, '../src/components/Money.tsx'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText;
const moduleExports = { exports: {} };
vm.runInNewContext(compiled, { module: moduleExports, exports: moduleExports.exports, require, Intl });
const { Money } = moduleExports.exports;

test('admin money keeps cents in seller payouts in English and Arabic while default display stays compatible', () => {
  for (const locale of ['en', 'ar']) {
    const precise = renderToStaticMarkup(Money({ amount: 4.5, currency: 'AED', locale, maximumFractionDigits: 2 }));
    assert.match(precise, /<span>4\.5<\/span>/);
    const normal = renderToStaticMarkup(Money({ amount: 4.5, currency: 'AED', locale }));
    assert.match(normal, /<span>5<\/span>/);
    const cents = renderToStaticMarkup(Money({ amount: 104.75, currency: 'AED', locale, maximumFractionDigits: 2 }));
    assert.match(cents, /<span>104\.75<\/span>/);
  }
  const usd = renderToStaticMarkup(Money({ amount: 4.5, currency: 'USD', locale: 'en', maximumFractionDigits: 2 }));
  assert.match(usd, /4\.50/);
});
