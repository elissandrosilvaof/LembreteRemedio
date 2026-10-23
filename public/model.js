(function (root) {
  "use strict";
  const professions = {
    fisioterapia: {
      name: "Fisioterapia",
      person: "Paciente",
      plural: "Pacientes",
      appointment: "Sessão",
      services: ["Sessão de fisioterapia", "Avaliação fisioterapêutica", "RPG"],
      duration: 50,
    },
    psicologia: {
      name: "Psicologia",
      person: "Paciente",
      plural: "Pacientes",
      appointment: "Consulta",
      services: ["Consulta de psicologia", "Primeira consulta"],
      duration: 50,
    },
    natacao: {
      name: "Natação",
      person: "Aluno",
      plural: "Alunos",
      appointment: "Aula",
      services: ["Aula de natação", "Avaliação de natação"],
      duration: 45,
    },
    pilates: {
      name: "Pilates",
      person: "Aluno",
      plural: "Alunos",
      appointment: "Aula",
      services: ["Aula de Pilates", "Avaliação de Pilates"],
      duration: 50,
    },
    quiropraxia: {
      name: "Quiropraxia",
      person: "Paciente",
      plural: "Pacientes",
      appointment: "Sessão",
      services: ["Sessão de quiropraxia", "Avaliação de quiropraxia"],
      duration: 40,
    },
    rpg: {
      name: "RPG",
      person: "Paciente",
      plural: "Pacientes",
      appointment: "Sessão",
      services: ["Sessão de RPG", "Avaliação postural"],
      duration: 60,
    },
  };
  const localDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const initial = () => ({
    version: 1,
    profile: { name: "", profession: "" },
    people: [],
    bookings: [],
  });
  function text(v, max, label, empty = false) {
    if (typeof v !== "string" || v.length > max || (!empty && !v.trim()))
      throw Error(label + " inválido(a).");
    return v.trim();
  }
  function person(p) {
    if (!p || typeof p !== "object") throw Error("Cadastro inválido.");
    const id = text(p.id, 100, "Identificador"),
      name = text(p.name, 80, "Nome"),
      phone = text(p.phone, 11, "Telefone", true);
    if (phone && !/^\d{10,11}$/.test(phone))
      throw Error("Informe telefone com DDD ou deixe em branco.");
    return { id, name, phone };
  }
  function booking(b) {
    if (!b || typeof b !== "object") throw Error("Agendamento inválido.");
    const id = text(b.id, 100, "Identificador"),
      personId = text(b.personId, 100, "Cadastro"),
      service = text(b.service, 100, "Atendimento");
    if (
      typeof b.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(b.date) ||
      +b.date.slice(0, 4) < 2000 ||
      +b.date.slice(0, 4) > 2100 ||
      localDate(new Date(b.date + "T12:00:00")) !== b.date
    )
      throw Error("Data inválida.");
    if (typeof b.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time))
      throw Error("Horário inválido.");
    if (!Number.isInteger(b.duration) || b.duration < 5 || b.duration > 480)
      throw Error("A duração deve ser de 5 a 480 minutos.");
    if (
      !Number.isFinite(b.price) ||
      b.price < 0 ||
      b.price > 100000 ||
      Math.abs(Math.round(b.price * 100) - b.price * 100) > 0.00001
    )
      throw Error("Valor inválido. Use até duas casas decimais.");
    if (minutes(b) + b.duration > 1440)
      throw Error("O atendimento deve terminar até meia-noite.");
    if (!["confirmed", "completed", "cancelled"].includes(b.status))
      throw Error("Status inválido.");
    return {
      id,
      personId,
      service,
      date: b.date,
      time: b.time,
      duration: b.duration,
      price: b.price,
      status: b.status,
    };
  }
  const minutes = (b) => +b.time.slice(0, 2) * 60 + +b.time.slice(3);
  function overlaps(a, b) {
    return (
      a.id !== b.id &&
      a.date === b.date &&
      a.status !== "cancelled" &&
      b.status !== "cancelled" &&
      minutes(a) < minutes(b) + b.duration &&
      minutes(b) < minutes(a) + a.duration
    );
  }
  function validate(data) {
    if (
      !data ||
      data.version !== 1 ||
      !data.profile ||
      !Array.isArray(data.people) ||
      !Array.isArray(data.bookings) ||
      data.people.length > 20000 ||
      data.bookings.length > 20000
    )
      throw Error("Dados inválidos ou limite de registros excedido.");
    const profile = {
      name: text(data.profile.name, 80, "Nome profissional", true),
      profession: data.profile.profession,
    };
    if (
      profile.profession !== "" &&
      !Object.hasOwn(professions, profile.profession)
    )
      throw Error("Área profissional inválida.");
    const people = data.people.map(person),
      bookings = data.bookings.map(booking),
      ids = new Set();
    for (const p of people) {
      if (ids.has(p.id)) throw Error("Cadastros repetidos.");
      ids.add(p.id);
    }
    const bids = new Set(),
      groups = new Map();
    for (const b of bookings) {
      if (!ids.has(b.personId))
        throw Error("Agendamento sem paciente ou aluno cadastrado.");
      if (bids.has(b.id)) throw Error("Agendamentos repetidos.");
      bids.add(b.id);
      if (b.status !== "cancelled") {
        const g = groups.get(b.date) || [];
        g.push(b);
        groups.set(b.date, g);
      }
    }
    for (const g of groups.values()) {
      g.sort((a, b) => a.time.localeCompare(b.time));
      for (let i = 1; i < g.length; i++)
        if (overlaps(g[i - 1], g[i]))
          throw Error("Há conflito de horários. Altere a data ou o horário.");
    }
    if (bookings.length && !profile.profession)
      throw Error("Escolha sua área profissional.");
    return { version: 1, profile, people, bookings };
  }
  function saveBooking(state, b, now = new Date()) {
    b = booking(b);
    if (!state.profile.profession)
      throw Error("Escolha sua área profissional.");
    if (
      b.status === "confirmed" &&
      new Date(b.date + "T" + b.time + ":00") <= now
    )
      throw Error("Escolha um horário futuro.");
    return validate({
      ...state,
      bookings: [...state.bookings.filter((x) => x.id !== b.id), b],
    });
  }
  function parseBackup(raw) {
    const d = JSON.parse(raw);
    if (d?.app !== "agenda-em-dia" || d.version !== 1)
      throw Error("Escolha um backup do Agenda em Dia.");
    return validate(d.data);
  }
  const api = {
    professions,
    localDate,
    initial,
    person,
    booking,
    overlaps,
    validate,
    saveBooking,
    parseBackup,
  };
  root.AgendaModel = api;
  if (typeof module !== "undefined") module.exports = api;
})(globalThis);
