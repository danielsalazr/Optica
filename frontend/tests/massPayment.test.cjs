const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../src/utils/massPayment.ts'), 'utf8');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, context);
const { distributePayments, proposePayments } = context.exports;
const rows = (balances) => balances.map((saldo, index) => ({ id: index + 1, saldo, precio: 100000, cuotas: 3 }));
const selected = (data) => new Set(data.map((row) => String(row.id)));

test('100000 / 3 preserves every peso', () => {
  const data = rows([100000, 100000, 100000]);
  const result = distributePayments(data, selected(data), 100000);
  assert.equal(result.reduce((sum, row) => sum + row.aplicar, 0), 100000);
  assert.equal(result[0].aplicar, 33334);
  assert.equal(result[1].aplicar, 33333);
  assert.equal(data[0].saldoInicial, undefined);
});

test('capped balances redistribute the excess', () => {
  const data = rows([10000, 100000]);
  const result = distributePayments(data, selected(data), 90000);
  assert.equal(result[0].aplicar, 10000);
  assert.equal(result[1].aplicar, 80000);
});

test('unselected sales do not receive payments', () => {
  const result = distributePayments(rows([100000, 100000]), new Set(['2']), 10000);
  assert.equal(result[0].aplicar, 0);
  assert.equal(result[1].aplicar, 10000);
});

test('quota mode uses total sale / installments and caps available funds', () => {
  const data = rows([100000, 100000]);
  const result = distributePayments(data, selected(data), 40000, true);
  assert.equal(result[0].aplicar, 33333);
  assert.equal(result[1].aplicar, 6667);
});

test('fractional and nonfinite totals are rejected', () => {
  for (const amount of [1.25, NaN, Infinity, -1]) {
    assert.throws(() => distributePayments(rows([100]), new Set(['1']), amount));
  }
});

test('consultation without an amount leaves all allocations at zero', () => {
  const data = rows([180000, 30000]);
  const result = distributePayments(data, selected(data), 0);
  assert.equal(result.reduce((sum, row) => sum + row.aplicar, 0), 0);
  assert.equal(result[0].saldoFinal, 180000);
});

test('one quota proposal determines its own amount and caps each balance', () => {
  const data = [
    { id: 1, precio: 300000, cuotas: 3, saldo: 180000 },
    { id: 2, precio: 200000, cuotas: 4, saldo: 30000 },
  ];
  const result = proposePayments(data, selected(data), true);
  assert.equal(result.amount, 130000);
  assert.equal(result.rows[0].aplicar, 100000);
  assert.equal(result.rows[1].aplicar, 30000);
});

test('settlement proposal respects selection and snapshot balances', () => {
  const data = [{ id: 1, precio: 100000, saldo: 90000, saldoInicial: 80000 },
    { id: 2, precio: 100000, saldo: 30000 }];
  const result = proposePayments(data, new Set(['1']));
  assert.equal(result.amount, 80000);
  assert.equal(result.rows[0].saldoFinal, 0);
  assert.equal(result.rows[1].aplicar, 0);
});

test('quota proposals without installments do not assign a guessed payment', () => {
  const data = [{ id: 1, precio: 100000, saldo: 80000, cuotas: null }];
  assert.equal(proposePayments(data, selected(data), true).amount, 0);
});

test('integer distributions preserve totals and never exceed balances', () => {
  let seed = 37;
  const random = (max) => { seed = (seed * 16807) % 2147483647; return seed % max; };
  for (let i = 0; i < 2000; i++) {
    const data = rows(Array.from({ length: 1 + random(20) }, () => random(100000)));
    const amount = random(1000000);
    const result = distributePayments(data, selected(data), amount);
    const capacity = data.reduce((sum, row) => sum + row.saldo, 0);
    assert.equal(result.reduce((sum, row) => sum + row.aplicar, 0), Math.min(amount, capacity));
    for (const row of result) {
      assert.ok(Number.isInteger(row.aplicar));
      assert.ok(row.saldoFinal >= 0);
      assert.equal(row.aplicar + row.saldoFinal, row.saldoInicial);
    }
  }
});
