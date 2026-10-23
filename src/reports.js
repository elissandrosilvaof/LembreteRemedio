const { jsPDF } = require("jspdf");
const { autoTable } = require("jspdf-autotable");
const statusLabels = {
  confirmed: "Agendado",
  completed: "Concluído",
  cancelled: "Cancelado",
  all: "Todos",
};
const modalityLabels = {
  particular: "Particular",
  plano: "Plano",
  avaliacao: "Avaliação",
  permuta: "Permuta",
  nao_informado: "Não informado",
  all: "Todas",
};
const dateLabel = (d) => d.split("-").reverse().join("/");
const currency = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
function periodLabel(report) {
  return report.period === "day"
    ? dateLabel(report.value)
    : report.period === "month"
      ? report.value.split("-").reverse().join("/")
      : report.value;
}
function safeCsv(value) {
  let s = String(value ?? "");
  if (/^\s*[=+\-@]/.test(s) || /^[\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
function createCsv(report) {
  const columns = [
    "Profissional",
    "Área",
    "Data",
    "Dia",
    "Mês",
    "Ano",
    "Hora",
    "Paciente / aluno",
    "Telefone",
    "Atendimento",
    "Modalidade",
    "Duração (min)",
    "Status",
    "Valor (R$)",
  ];
  if (report.includeNotes) columns.push("Anamnese");
  const rows = report.rows.map((b) => {
    const [year, month, day] = b.date.split("-");
    const values = [
      report.profile.name,
      report.profile.profession,
      dateLabel(b.date),
      day,
      month,
      year,
      b.time,
      b.personName,
      b.phone,
      b.service,
      modalityLabels[b.modality],
      b.duration,
      statusLabels[b.status],
      b.price.toFixed(2).replace(".", ","),
    ];
    if (report.includeNotes) values.push(b.anamnesis);
    return values;
  });
  return (
    "\uFEFF" +
    [columns, ...rows].map((row) => row.map(safeCsv).join(";")).join("\r\n")
  );
}
function createPdf(report) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setProperties({
    title: "Agenda em Dia — Relatório de atendimentos",
    author: report.profile.name || "Agenda em Dia",
  });
  doc.setFontSize(18);
  doc.setTextColor(40, 95, 99);
  doc.text("Agenda em Dia | Relatório de atendimentos", 12, 15);
  autoTable(doc, {
    startY: 21,
    margin: { left: 12, right: 12, top: 15, bottom: 16 },
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2 },
    body: [
      [
        "Profissional",
        report.profile.name || "Não informado",
        "Período",
        periodLabel(report),
      ],
      [
        "Cadastros",
        report.personLabel,
        "Filtros",
        `${modalityLabels[report.modality]} | ${statusLabels[report.status]}`,
      ],
      [
        "Atendimentos",
        String(report.total),
        "Concluídos / cancelados",
        `${report.completed} / ${report.cancelled}`,
      ],
      [
        "Valor dos concluídos",
        currency(report.totalCompleted),
        "Emitido em",
        new Date().toLocaleString("pt-BR"),
      ],
    ],
    columnStyles: { 0: { fontStyle: "bold" }, 2: { fontStyle: "bold" } },
  });
  const head = [
    "Data / hora",
    "Paciente / aluno",
    "Atendimento",
    "Modalidade",
    "Min",
    "Status",
    "Valor (R$)",
  ];
  if (report.includeNotes) head.push("Anamnese");
  const body = report.rows.map((b) => {
    const row = [
      `${dateLabel(b.date)}\n${b.time}`,
      b.personName,
      b.service,
      modalityLabels[b.modality],
      String(b.duration),
      statusLabels[b.status],
      currency(b.price),
    ];
    if (report.includeNotes) row.push(b.anamnesis || "—");
    return row;
  });
  if (body.length)
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 6,
      head: [head],
      body,
      margin: { left: 12, right: 12, top: 14, bottom: 18 },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: { fillColor: [40, 95, 99] },
      alternateRowStyles: { fillColor: [244, 247, 244] },
      columnStyles: report.includeNotes
        ? {
            0: { cellWidth: 29 },
            1: { cellWidth: 36 },
            2: { cellWidth: 39 },
            3: { cellWidth: 24 },
            4: { cellWidth: 12 },
            5: { cellWidth: 22 },
            6: { cellWidth: 23 },
            7: { cellWidth: 88 },
          }
        : {},
      showHead: "everyPage",
    });
  else {
    doc.setFontSize(11);
    doc.text(
      "Nenhum atendimento encontrado para estes filtros.",
      12,
      doc.lastAutoTable.finalY + 12,
    );
  }
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(95, 105, 100);
    doc.text(
      "Uso restrito ao profissional. Valores concluídos não comprovam recebimento.",
      12,
      198,
    );
    doc.text(`Página ${i} de ${pages}`, 284, 198, { align: "right" });
    doc.text("Desenvolvido por Elissandro Silva Polidoro", 12, 203);
  }
  return doc.output("datauristring").split(",")[1];
}
module.exports = { createCsv, createPdf, safeCsv, periodLabel };
