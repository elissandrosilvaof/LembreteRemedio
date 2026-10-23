const { test } = require("node:test");
const assert = require("node:assert/strict");
const M = require("../public/model");
const base = {
  price: 70,
  id: "1",
  name: "Cliente",
  phone: "11999999999",
  service: "combo",
  date: "2030-01-07",
  time: "10:00",
  status: "confirmed",
};
test("bloqueia sobreposição pela duração e libera após cancelamento", () => {
  assert.throws(
    () => M.saveBooking([base], { ...base, id: "2", time: "10:30" }),
    /sobrepostos/,
  );
  assert.equal(
    M.saveBooking([{ ...base, status: "cancelled" }], {
      ...base,
      id: "2",
      time: "10:30",
    }).length,
    2,
  );
  assert.equal(
    M.saveBooking([base], { ...base, id: "2", time: "11:00" }).length,
    2,
  );
});
test("edição não conflita consigo mesma", () => {
  const list = M.saveBooking([base], {
    ...base,
    name: "Novo nome",
    time: "10:30",
  });
  assert.equal(list.length, 1);
  assert.equal(list[0].time, "10:30");
});
test("rejeita datas, telefone, domingo e serviço que ultrapassa fechamento", () => {
  for (const patch of [
    { date: "2030-02-30" },
    { date: "2030-01-06" },
    { phone: "123" },
    { time: "18:30" },
    { time: "08:30" },
    { time: "10:15" },
  ])
    assert.throws(() => M.validateBooking({ ...base, ...patch }));
});
test("restaura backup completo sem aceitar duplicatas ou conflitos", () => {
  const backup = { app: "brava-agenda", version: 1, bookings: [base] };
  assert.deepEqual(M.parseBackup(JSON.stringify(backup)), [base]);
  assert.throws(() => M.parseBackup(JSON.stringify({ ...backup, version: 3 })));
  assert.throws(() => M.validateAll([base, base]), /repetidos/);
  assert.throws(
    () => M.validateAll([base, { ...base, id: "2" }]),
    /sobrepostos/,
  );
});
test("horário passado não pode ser salvo como agendado", () => {
  assert.throws(
    () => M.saveBooking([], base, new Date("2030-01-08T10:00:00")),
    /futuro/,
  );
});

test("preços editados não alteram valores de agendamentos salvos", () => {
  const old = M.validateAll([{ ...base, price: 70 }]);
  const prices = M.validatePrices({ ...M.defaultPrices(), combo: 90 });
  assert.equal(prices.combo, 90);
  assert.equal(old[0].price, 70);
  assert.equal(M.validateBooking({ ...base, price: 0 }).price, 0);
  for (const price of [-1, NaN, Infinity, 10.001])
    assert.throws(() => M.validateBooking({ ...base, price }));
});
test("dados antigos e backups novos preservam tabela e valores combinados", () => {
  const { price, ...legacy } = base;
  assert.equal(M.readState([legacy]).bookings[0].price, 70);
  const state = {
    app: "brava-agenda",
    version: 2,
    bookings: [base],
    prices: { ...M.defaultPrices(), combo: 90 },
  };
  const parsed = M.parseBackupData(JSON.stringify(state));
  assert.equal(parsed.prices.combo, 90);
  assert.equal(parsed.bookings[0].price, 70);
  assert.throws(() => M.readState({ ...state, prices: { cut: 45 } }));
});
