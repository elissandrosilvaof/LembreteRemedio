const { test } = require("node:test");
const assert = require("node:assert/strict");
const M = require("../public/model");
const { createPdf, createCsv, safeCsv } = require("../src/reports");
const fixture = () =>
  M.validate({
    version: 1,
    profile: { name: "Profissional", profession: "fisioterapia" },
    people: [
      { id: "a", name: "Ana", phone: "11999999999" },
      { id: "b", name: "Bruno", phone: "" },
    ],
    bookings: [
      {
        id: "1",
        personId: "a",
        service: "RPG",
        duration: 50,
        price: 100.1,
        date: "2030-01-07",
        time: "10:00",
        status: "completed",
        modality: "plano",
        anamnesis: "NOTA_CONFIDENCIAL\nSegunda linha",
      },
      {
        id: "2",
        personId: "b",
        service: "Avaliação",
        duration: 30,
        price: 200.2,
        date: "2030-01-07",
        time: "11:00",
        status: "completed",
        modality: "avaliacao",
      },
      {
        id: "3",
        personId: "a",
        service: "RPG",
        duration: 50,
        price: 0,
        date: "2030-01-08",
        time: "10:00",
        status: "cancelled",
        modality: "permuta",
      },
      {
        id: "4",
        personId: "b",
        service: "RPG",
        duration: 50,
        price: 99,
        date: "2030-02-01",
        time: "10:00",
        status: "confirmed",
        modality: "particular",
      },
      {
        id: "5",
        personId: "a",
        service: "RPG",
        duration: 50,
        price: 150,
        date: "2031-01-07",
        time: "10:00",
        status: "completed",
        modality: "plano",
      },
    ],
  });
test("migra registros antigos sem inventar modalidade ou data de criação", () => {
  const s = fixture();
  assert.equal(s.version, 2);
  assert.equal(s.bookings[0].createdAt, null);
  const { modality, anamnesis, ...old } = s.bookings[0];
  const migrated = M.booking(old);
  assert.equal(migrated.modality, "nao_informado");
  assert.equal(migrated.anamnesis, "");
  assert.throws(() => M.booking({ ...old, modality: "toString" }));
});
test("filtra limites de dia, mês e ano sem misturar outros períodos", () => {
  const s = fixture();
  assert.equal(
    M.buildReport(s, { period: "day", value: "2030-01-07" }).total,
    2,
  );
  assert.equal(
    M.buildReport(s, { period: "month", value: "2030-01" }).total,
    3,
  );
  assert.equal(M.buildReport(s, { period: "year", value: "2030" }).total, 4);
  assert.equal(M.buildReport(s, { period: "year", value: "2031" }).total, 1);
  for (const filters of [
    { period: "day", value: "2030-02-30" },
    { period: "month", value: "2030-13" },
    { period: "year", value: "2030-" },
    { period: "other", value: "2030" },
  ])
    assert.throws(() => M.buildReport(s, filters));
});
test("filtra paciente, modalidade e status; soma valores concluídos em centavos", () => {
  const s = fixture(),
    f = { period: "month", value: "2030-01" };
  const all = M.buildReport(s, f);
  assert.equal(all.totalCompleted, 300.3);
  assert.equal(all.cancelled, 1);
  assert.equal(M.buildReport(s, { ...f, personId: "a" }).total, 2);
  assert.equal(
    M.buildReport(s, { ...f, modality: "plano", status: "completed" }).total,
    1,
  );
  assert.equal(
    M.buildReport(s, { ...f, modality: "permuta" }).totalCompleted,
    0,
  );
  assert.throws(() => M.buildReport(s, { ...f, personId: "missing" }));
  assert.throws(() => M.buildReport(s, { ...f, status: "missing" }));
});
test("anamnese de atendimento passado concluído é editada e preservada no backup", () => {
  const s = fixture(),
    now = new Date("2032-01-01T12:00:00Z");
  const edited = M.updateDetails(
    s,
    "1",
    { modality: "permuta", anamnesis: " Nova nota\ncom quebras " },
    now,
  );
  assert.equal(edited.bookings[0].anamnesis, " Nova nota\ncom quebras ");
  assert.equal(edited.bookings[0].status, "completed");
  assert.equal(edited.bookings[0].date, "2030-01-07");
  assert.equal(edited.bookings[0].updatedAt, now.toISOString());
  assert.equal(s.bookings[0].modality, "plano");
  assert.deepEqual(
    M.parseBackup(
      JSON.stringify({ app: "agenda-em-dia", version: 2, data: edited }),
    ),
    edited,
  );
  assert.throws(() =>
    M.updateDetails(s, "1", { anamnesis: "x".repeat(10001) }),
  );
});
test("CSV inclui data completa e colunas de dia/mês/ano; protege fórmulas e texto multiline", () => {
  const s = fixture(),
    f = { period: "year", value: "2030" };
  const csv = createCsv(M.buildReport(s, f));
  assert(csv.includes('"07/01/2030";"07";"01";"2030"'));
  assert(!csv.includes("NOTA_CONFIDENCIAL"));
  assert(!csv.includes('"Anamnese"'));
  const withNotes = createCsv(M.buildReport(s, { ...f, includeNotes: true }));
  assert(withNotes.includes("NOTA_CONFIDENCIAL\nSegunda linha"));
  assert.equal(safeCsv('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(safeCsv("  +2"), '"\'  +2"');
});
test("PDF gera páginas reais e omite anamnese por padrão", () => {
  const r = M.buildReport(fixture(), { period: "year", value: "2030" });
  const pdf = Buffer.from(createPdf(r), "base64").toString("latin1");
  assert(pdf.startsWith("%PDF-"));
  assert(pdf.includes("07/01/2030"));
  assert(!pdf.includes("NOTA_CONFIDENCIAL"));
  const long = {
    ...r,
    includeNotes: true,
    rows: Array.from({ length: 50 }, (_, i) => ({
      ...r.rows[0],
      personName: "Paciente " + i,
      anamnesis: "NOTA_CONFIDENCIAL\n" + "Observacao detalhada. ".repeat(60),
    })),
  };
  const longPdf = Buffer.from(createPdf(long), "base64").toString("latin1");
  assert(longPdf.includes("NOTA_CONFIDENCIAL"));
  assert((longPdf.match(/\/Type \/Page\b/g) || []).length > 1);
  assert(longPdf.includes("Paciente 49"));
});
test("cria carimbo de registro e permite registrar atendimento histórico concluído", () => {
  const s = fixture(),
    now = new Date("2035-01-01T10:00:00Z"),
    b = { ...s.bookings[0], id: "new", date: "2029-01-02" };
  const next = M.saveBooking(s, b, now);
  assert.equal(next.bookings.at(-1).createdAt, now.toISOString());
  assert.equal(next.bookings.at(-1).date, "2029-01-02");
  const report = M.buildReport(next, {
    period: "year",
    value: "2029",
    includeNotes: true,
  });
  assert.equal(report.total, 1);
});
