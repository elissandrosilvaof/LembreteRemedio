const { test } = require("node:test");
const assert = require("node:assert/strict");
const M = require("../public/model");
const person = { id: "p1", name: "Maria", phone: "11999999999" };
const base = {
  id: "1",
  personId: "p1",
  service: "Sessão de RPG",
  date: "2030-01-07",
  time: "10:00",
  duration: 50,
  price: 150,
  status: "confirmed",
};
const state = () => ({
  ...M.initial(),
  profile: { name: "Elissandro", profession: "fisioterapia" },
  people: [person],
});
test("sobreposição usa duração personalizada, independente da área e serviço", () => {
  const s = M.saveBooking(state(), base);
  assert.throws(
    () => M.saveBooking(s, { ...base, id: "2", time: "10:45" }),
    /conflito/,
  );
  assert.equal(
    M.saveBooking(s, { ...base, id: "2", time: "10:50" }).bookings.length,
    2,
  );
});
test("edição não conflita consigo; cancelamento libera horário; conclusão mantém ocupado", () => {
  const s = M.saveBooking(state(), base);
  assert.equal(M.saveBooking(s, { ...base, time: "10:30" }).bookings.length, 1);
  assert.equal(
    M.saveBooking(
      { ...s, bookings: [{ ...base, status: "cancelled" }] },
      { ...base, id: "2" },
    ).bookings.length,
    2,
  );
  assert.throws(
    () =>
      M.saveBooking(
        { ...s, bookings: [{ ...base, status: "completed" }] },
        { ...base, id: "2" },
      ),
    /conflito/,
  );
});
test("valida datas reais, duração, preço, horário e vínculo", () => {
  for (const patch of [
    { date: "2030-02-30" },
    { duration: 0 },
    { duration: 481 },
    { duration: 30.5 },
    { price: -1 },
    { price: 0.001 },
    { price: Infinity },
    { time: "25:00" },
    { time: "23:30", duration: 60 },
    { personId: "inexistente" },
  ])
    assert.throws(() => M.saveBooking(state(), { ...base, ...patch }));
});
test("agenda aceita domingo e início fora do antigo horário da barbearia", () => {
  assert.equal(
    M.saveBooking(state(), { ...base, date: "2030-01-06", time: "07:15" })
      .bookings[0].time,
    "07:15",
  );
});
test("áreas incluem psicologia, natação, Pilates, quiropraxia, RPG e fisioterapia", () => {
  for (const profession of Object.keys(M.professions)) {
    const s = M.validate({
      ...state(),
      profile: { name: "Profissional", profession },
    });
    assert.equal(s.profile.profession, profession);
  }
  assert.equal(M.professions.natacao.person, "Aluno");
  assert.equal(M.professions.psicologia.person, "Paciente");
  assert(M.professions.fisioterapia.services.includes("RPG"));
});
test("backup preserva perfil, cadastro, preços, duração e status e rejeita outro app", () => {
  const s = M.saveBooking(state(), base);
  const backup = { app: "agenda-em-dia", version: 1, data: s };
  assert.deepEqual(M.parseBackup(JSON.stringify(backup)), s);
  assert.throws(() =>
    M.parseBackup(JSON.stringify({ ...backup, app: "brava-agenda" })),
  );
  assert.throws(
    () => M.validate({ ...s, people: [person, person] }),
    /repetidos/,
  );
  assert.throws(
    () => M.validate({ ...s, bookings: [base, base] }),
    /repetidos/,
  );
});
test("não aceita agendamento passado ou área inválida", () => {
  assert.throws(
    () => M.saveBooking(state(), base, new Date("2030-01-08T12:00:00")),
    /futuro/,
  );
  assert.throws(
    () =>
      M.saveBooking(
        { ...state(), profile: { name: "", profession: "" } },
        base,
      ),
    /área/,
  );
  assert.throws(
    () =>
      M.validate({ ...state(), profile: { name: "", profession: "toString" } }),
    /Área/,
  );
});
test("cadastro permite telefone opcional e normaliza nome", () => {
  assert.deepEqual(M.person({ ...person, name: " Maria ", phone: "" }), {
    ...person,
    name: "Maria",
    phone: "",
  });
  assert.throws(() => M.person({ ...person, phone: "123" }));
});
