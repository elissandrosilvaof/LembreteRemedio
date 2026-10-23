(function (root) {
  const services = [
    { id: "cut", name: "Corte de cabelo", price: 45, duration: 30 },
    { id: "beard", name: "Barba completa", price: 35, duration: 30 },
    { id: "combo", name: "Corte + barba", price: 70, duration: 60 },
    { id: "premium", name: "Experiência Brava", price: 95, duration: 90 },
  ];
  const localDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  function validateBooking(b) {
    if (!b || typeof b.id !== "string" || !b.id || b.id.length > 100)
      throw Error("Identificador inválido.");
    if (typeof b.name !== "string" || !b.name.trim() || b.name.length > 80)
      throw Error("Informe o nome do cliente.");
    if (typeof b.phone !== "string" || !/^\d{10,11}$/.test(b.phone))
      throw Error("Informe um telefone com DDD (10 ou 11 dígitos).");
    if (!services.some((s) => s.id === b.service))
      throw Error("Serviço inválido.");
    if (
      typeof b.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(b.date) ||
      Number(b.date.slice(0, 4)) < 2000 ||
      Number(b.date.slice(0, 4)) > 2100 ||
      localDate(new Date(b.date + "T12:00:00")) !== b.date
    )
      throw Error("Data inválida.");
    if (typeof b.time !== "string" || !/^([01]\d|2[0-3]):[03]0$/.test(b.time))
      throw Error("Horário inválido.");
    if (!["confirmed", "completed", "cancelled"].includes(b.status))
      throw Error("Status inválido.");
    const duration = services.find((s) => s.id === b.service).duration;
    const minutes = Number(b.time.slice(0, 2)) * 60 + Number(b.time.slice(3));
    if (
      new Date(b.date + "T12:00:00").getDay() === 0 ||
      minutes < 540 ||
      minutes + duration > 1140
    )
      throw Error("Atendimento de segunda a sábado, das 9h às 19h.");
    const price = validatePrice(
      b.price === undefined
        ? services.find((s) => s.id === b.service).price
        : b.price,
    );
    return {
      price,
      id: b.id,
      name: b.name.trim(),
      phone: b.phone,
      service: b.service,
      date: b.date,
      time: b.time,
      status: b.status,
    };
  }
  function overlaps(a, b) {
    if (
      a.id === b.id ||
      a.status === "cancelled" ||
      b.status === "cancelled" ||
      a.date !== b.date
    )
      return false;
    const start = (x) =>
      Number(x.time.slice(0, 2)) * 60 + Number(x.time.slice(3));
    const duration = (x) => services.find((s) => s.id === x.service).duration;
    return (
      start(a) < start(b) + duration(b) && start(b) < start(a) + duration(a)
    );
  }
  function validateAll(data) {
    if (!Array.isArray(data) || data.length > 20000)
      throw Error("Backup inválido ou muito grande.");
    const result = data.map(validateBooking);
    const ids = new Set();
    const groups = new Map();
    for (const b of result) {
      if (ids.has(b.id)) throw Error("Backup com identificadores repetidos.");
      ids.add(b.id);
      if (b.status !== "cancelled") {
        const group = groups.get(b.date) || [];
        group.push(b);
        groups.set(b.date, group);
      }
    }
    for (const group of groups.values()) {
      group.sort((a, b) => a.time.localeCompare(b.time));
      for (let i = 1; i < group.length; i++)
        if (overlaps(group[i - 1], group[i]))
          throw Error("Há agendamentos com horários sobrepostos.");
    }
    return result;
  }
  function saveBooking(list, booking, now = new Date()) {
    const b = validateBooking(booking);
    if (
      b.status === "confirmed" &&
      new Date(b.date + "T" + b.time + ":00") <= now
    )
      throw Error("Escolha um horário futuro.");
    const next = list.filter((x) => x.id !== b.id).concat(b);
    return validateAll(next);
  }
  function validatePrice(price) {
    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 100000 ||
      Math.abs(price * 100 - Math.round(price * 100)) > 0.00001
    )
      throw Error(
        "Informe um valor entre 0 e 100.000 com até duas casas decimais.",
      );
    return price;
  }
  function defaultPrices() {
    return Object.fromEntries(services.map((s) => [s.id, s.price]));
  }
  function validatePrices(prices) {
    if (!prices || typeof prices !== "object" || Array.isArray(prices))
      throw Error("Tabela de preços inválida.");
    return Object.fromEntries(
      services.map((s) => [s.id, validatePrice(prices[s.id])]),
    );
  }
  function readState(data) {
    if (Array.isArray(data))
      return { bookings: validateAll(data), prices: defaultPrices() };
    if (!data || data.version !== 2) throw Error("Dados da agenda inválidos.");
    return {
      bookings: validateAll(data.bookings),
      prices: validatePrices(data.prices),
    };
  }
  function parseBackupData(text) {
    const data = JSON.parse(text);
    if (data?.app !== "brava-agenda" || ![1, 2].includes(data.version))
      throw Error("Este arquivo não é um backup da Agenda Brava.");
    if (data.version === 1) return readState(data.bookings);
    return readState(data);
  }
  function parseBackup(text) {
    return parseBackupData(text).bookings;
  }
  const api = {
    services,
    localDate,
    validateAll,
    validateBooking,
    overlaps,
    saveBooking,
    parseBackup,
    parseBackupData,
    readState,
    defaultPrices,
    validatePrices,
  };
  root.BravaModel = api;
  if (typeof module !== "undefined") module.exports = api;
})(globalThis);
