const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('src/app/admin/overview/overviewRange.ts', 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const helpers = {};
vm.runInNewContext(output, { exports: helpers });
const { overviewRange } = helpers;

function assertRange(days, now, expectedFrom, expectedTo) {
  const range = overviewRange(days, new Date(now));
  assert.equal(range.from, expectedFrom);
  assert.equal(range.to, expectedTo);
  assert.match(range.from, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(range.to, /^\d{4}-\d{2}-\d{2}$/);
  const includedDays = (Date.parse(`${range.to}T00:00:00Z`) - Date.parse(`${range.from}T00:00:00Z`)) / 86400000 + 1;
  assert.equal(includedDays, days, 'today counts as one of the selected calendar days');
}

test('reporting day advances at Dubai midnight, four hours before UTC midnight', () => {
  assertRange(7, '2026-10-10T19:59:59.999Z', '2026-10-04', '2026-10-10');
  assertRange(7, '2026-10-10T20:00:00.000Z', '2026-10-05', '2026-10-11');
});

test('UTC midnight does not change a Dubai reporting day already in progress', () => {
  assertRange(7, '2026-10-10T23:59:59.999Z', '2026-10-05', '2026-10-11');
  assertRange(7, '2026-10-11T00:00:00.000Z', '2026-10-05', '2026-10-11');
});

test('seven, thirty and ninety day ranges include exactly that many calendar dates', () => {
  assertRange(7, '2026-10-10T21:00:00Z', '2026-10-05', '2026-10-11');
  assertRange(30, '2026-10-10T21:00:00Z', '2026-09-12', '2026-10-11');
  assertRange(90, '2026-10-10T21:00:00Z', '2026-07-14', '2026-10-11');
  assertRange(1, '2026-10-10T21:00:00Z', '2026-10-11', '2026-10-11');
});

test('ranges cross month and year boundaries without losing the current day', () => {
  assertRange(7, '2025-01-01T08:00:00Z', '2024-12-26', '2025-01-01');
  assertRange(30, '2026-02-01T08:00:00Z', '2026-01-03', '2026-02-01');
  assertRange(7, '2026-03-01T08:00:00Z', '2026-02-23', '2026-03-01');
});

test('leap day participates in the selected reporting period', () => {
  assertRange(7, '2024-03-01T08:00:00Z', '2024-02-24', '2024-03-01');
  assertRange(30, '2024-03-01T08:00:00Z', '2024-02-01', '2024-03-01');
  assertRange(90, '2024-03-01T08:00:00Z', '2023-12-03', '2024-03-01');
  assertRange(1, '2024-02-28T20:00:00Z', '2024-02-29', '2024-02-29');
});

test('browser or operating-system timezone cannot move the reporting bounds', () => {
  const originalTimezone = process.env.TZ;
  try {
    for (const timezone of ['UTC', 'America/Los_Angeles', 'Asia/Tokyo', 'Asia/Dubai']) {
      process.env.TZ = timezone;
      assertRange(30, '2026-10-10T20:00:00Z', '2026-09-12', '2026-10-11');
    }
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});

test('invalid day counts cannot silently produce a different reporting period', () => {
  for (const days of [0, -7, 1.5, NaN, Infinity]) {
    assert.throws(() => overviewRange(days, new Date('2026-10-11T08:00:00Z')), /positive integer/);
  }
});
