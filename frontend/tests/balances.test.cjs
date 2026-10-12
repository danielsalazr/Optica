const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const context = { exports: {}, Date };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/utils/balances.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, context);
const { dateOnly, overdue, balanceDate, safeCsvCell, parseCalendarDate, localISODate } = context.exports;

test('sales and jornadas share calendar-month due dates', () => {
  const { paymentDueDate } = context.exports;
  for (const [start, count, expected] of [['2026-01-30',3,'2026-03-30'],['2026-01-30',2,'2026-02-28'],['2028-01-30',2,'2028-02-29'],['2026-12-30',3,'2027-02-28'],['2026-03-30',1,'2026-03-30']]) {
    assert.equal(localISODate(paymentDueDate(parseCalendarDate(start),'mensual',count)),expected);
  }
  assert.equal(localISODate(paymentDueDate(parseCalendarDate('2026-03-30'),'contado',1)),'2026-03-30');
  assert.equal(paymentDueDate(null,'mensual',2),null);
  assert.equal(paymentDueDate(parseCalendarDate('2026-03-30'),'mensual',0),null);
});

test('calendar dates round trip in Bogota without changing business day', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'America/Bogota';
  try {
    for (const value of ['2026-04-06', '2026-01-01', '2028-02-29']) {
      assert.equal(localISODate(parseCalendarDate(value)), value);
    }
    assert.equal(parseCalendarDate('2026-02-30'), null);
    assert.equal(localISODate(parseCalendarDate(null)), '');
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('installment limits reject huge values without a day-by-day loop', () => {
  const { paymentDueDate, MAX_INSTALLMENTS } = context.exports;
  assert.equal(MAX_INSTALLMENTS,360);
  for (const count of [361,2147483647,Infinity,NaN,1.5,-1,0]) {
    assert.equal(paymentDueDate(parseCalendarDate('2026-01-30'),'quincenal',count),null);
  }
});

test('month-chunk quincenal calculation matches the previous calendar rule', () => {
  const { paymentDueDate } = context.exports;
  for (const start of ['2026-01-30','2026-01-31','2026-02-28','2028-02-29','2026-12-31','2026-04-15']) {
    for (const count of [1,2,3,12,36,120,360]) {
      const expected = parseCalendarDate(start);
      let remaining = (count-1)*15;
      while (remaining>0) {
        expected.setDate(expected.getDate()+1);
        if (expected.getDate()!==31) remaining--;
      }
      assert.equal(localISODate(paymentDueDate(parseCalendarDate(start),'quincenal',count)),localISODate(expected));
    }
  }
});

test('plain dates and naive datetimes keep their business day', () => {
  assert.equal(balanceDate('2026-04-06'), '06/04/2026');
  assert.equal(balanceDate('2026-04-06T00:00:00'), '06/04/2026');
});
test('missing and invalid dates do not throw or become expired dates', () => {
  for (const value of [null, undefined, '', 'invalid', '2026-02-30', '2026-13-01']) {
    assert.equal(dateOnly(value), null);
    assert.equal(overdue(value, '2026-04-06'), false);
    assert.equal(balanceDate(value), 'Sin indicar');
  }
});
test('due today is not overdue and the server day determines overdue status', () => {
  assert.equal(overdue('2026-04-05', '2026-04-06'), true);
  assert.equal(overdue('2026-04-06', '2026-04-06'), false);
  assert.equal(overdue('2026-04-07', '2026-04-06'), false);
  assert.equal(overdue('2026-04-05', null), false);
});
test('csv quotes text and prevents spreadsheet formulas', () => {
  assert.equal(safeCsvCell('Cliente; "Prueba"'), '"Cliente; ""Prueba"""');
  assert.equal(safeCsvCell('=1+1'), '"\'=1+1"');
  assert.equal(safeCsvCell('\t@SUM(1)'), '"\'\t@SUM(1)"');
  assert.equal(safeCsvCell(10000), '"10000"');
});
