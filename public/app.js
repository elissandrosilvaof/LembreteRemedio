"use strict";
const $ = (s) => document.querySelector(s),
  M = AgendaModel;
const money = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
let state = M.initial(),
  editing = null,
  editingPerson = null,
  busy = false,
  healthy = false;
const storage = window.AgendaNative || {
  read: async () => localStorage.getItem("agenda-em-dia-v1"),
  write: async (v) => localStorage.setItem("agenda-em-dia-v1", v),
  exportBackup: async (text, filename) => {
    const u = URL.createObjectURL(
        new Blob([text], { type: "application/json" }),
      ),
      a = document.createElement("a");
    a.href = u;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 10000);
  },
};
const terms = () =>
  M.professions[state.profile.profession] || {
    person: "Pessoa",
    plural: "Cadastros",
    appointment: "Atendimento",
    services: [],
    duration: 50,
  };
const uuid = () => crypto.randomUUID();
$("#agenda-date").value = M.localDate(new Date());
for (const [id, p] of Object.entries(M.professions))
  $("#profession").add(new Option(p.name, id));
function announce(text) {
  $("#message").textContent = text;
}
function el(tag, text, cls) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}
function buttons() {
  for (const id of ["new-booking", "new-person", "profile-open", "export"])
    $("#" + id).disabled = !healthy || busy;
  $("#import").disabled = busy;
}
async function persist(next) {
  if (busy) throw Error("Aguarde o salvamento atual.");
  next = M.validate(next);
  busy = true;
  buttons();
  try {
    await storage.write(JSON.stringify(next));
    state = next;
    healthy = true;
    $("#storage-warning").hidden = true;
    render();
  } finally {
    busy = false;
    buttons();
  }
}
function tab(id) {
  document
    .querySelectorAll(".tab-view")
    .forEach((n) => (n.hidden = n.id !== id));
  document
    .querySelectorAll("[data-tab]")
    .forEach((n) => n.classList.toggle("active", n.dataset.tab === id));
}
function render() {
  const t = terms();
  $("#people-tab").textContent = t.plural;
  $("#people-heading").textContent = t.plural;
  $("#person-label").textContent = t.person;
  $("#quick-person").textContent = "+ Cadastrar " + t.person.toLowerCase();
  $("#area-label").textContent = t.name || "SUA ROTINA, ORGANIZADA";
  $("#welcome").textContent = state.profile.name
    ? `${state.profile.name}, sua agenda está em boas mãos.`
    : "Sua rotina profissional organizada, mesmo sem internet.";
  renderAgenda();
  renderPeople();
}
function renderAgenda() {
  const day = state.bookings.filter((b) => b.date === $("#agenda-date").value),
    filter = $("#status-filter").value;
  $("#stat-count").textContent = day.filter(
    (b) => b.status === "confirmed",
  ).length;
  $("#stat-done").textContent = day.filter(
    (b) => b.status === "completed",
  ).length;
  $("#stat-total").textContent = money(
    day
      .filter((b) => b.status === "completed")
      .reduce((n, b) => n + b.price, 0),
  );
  const root = $("#appointment-list");
  root.replaceChildren();
  const list = day
    .filter((b) => filter === "all" || b.status === filter)
    .sort((a, b) => a.time.localeCompare(b.time));
  if (!list.length)
    root.append(
      el(
        "p",
        "Seu dia tem espaço para novos encontros. Toque em + Agendar para começar.",
        "empty",
      ),
    );
  for (const b of list) {
    const p = state.people.find((p) => p.id === b.personId),
      card = el("article", undefined, "appointment"),
      body = el("div", undefined, "appointment-content");
    body.append(
      el("h3", p.name),
      el("p", `${b.service} · ${b.duration} min · ${money(b.price)}`),
    );
    if (p.phone) body.append(el("p", p.phone));
    body.append(
      el(
        "span",
        {
          confirmed: "Agendado",
          completed: "Concluído",
          cancelled: "Cancelado",
        }[b.status],
        "badge " + b.status,
      ),
    );
    if (b.status === "confirmed") {
      const actions = el("div", undefined, "actions");
      for (const [action, label] of [
        ["edit", "Editar"],
        ["complete", "Concluir"],
        ["cancel", "Cancelar"],
      ]) {
        const btn = el(
          "button",
          label,
          "secondary" + (action === "cancel" ? " danger" : ""),
        );
        btn.dataset.action = action;
        btn.dataset.id = b.id;
        actions.append(btn);
      }
      body.append(actions);
    }
    card.append(el("div", b.time, "hour"), body);
    root.append(card);
  }
}
function renderPeople() {
  const q = $("#search-person").value.toLocaleLowerCase("pt-BR"),
    root = $("#people-list");
  root.replaceChildren();
  const list = state.people
    .filter((p) =>
      `${p.name} ${p.phone}`.toLocaleLowerCase("pt-BR").includes(q),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  if (!list.length)
    root.append(
      el(
        "p",
        "Nenhum cadastro encontrado. Use + Cadastrar para adicionar.",
        "empty",
      ),
    );
  for (const p of list) {
    const card = el("article", undefined, "person-card"),
      body = el("div");
    body.append(el("h3", p.name), el("p", p.phone || "Sem telefone"));
    const edit = el("button", "Editar", "secondary");
    edit.dataset.person = p.id;
    card.append(body, edit);
    root.append(card);
  }
}
function personOptions(selected) {
  const opts = [new Option("Selecione um cadastro", "")];
  for (const p of [...state.people].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  ))
    opts.push(new Option(`${p.name}${p.phone ? " · " + p.phone : ""}`, p.id));
  $("#person").replaceChildren(...opts);
  $("#person").value = selected || "";
}
function openProfile() {
  $("#profile-name").value = state.profile.name;
  $("#profession").value = state.profile.profession;
  $("#profile-error").textContent = "";
  $("#profile-editor").showModal();
}
function openEditor(b) {
  if (!state.profile.profession) return openProfile();
  editing = b?.id || null;
  $("#booking-form").reset();
  $("#editor-title").textContent = editing
    ? "Editar agendamento"
    : "Novo agendamento";
  $("#form-error").textContent = "";
  personOptions(b?.personId);
  $("#service-options").replaceChildren(
    ...terms().services.map((s) => new Option(s, s)),
  );
  $("#service").value = b?.service || terms().services[0] || "";
  $("#duration").value = b?.duration || terms().duration;
  $("#price").value = b?.price ?? 0;
  $("#date").min = M.localDate(new Date());
  $("#date").max = "2100-12-31";
  const day = $("#agenda-date").value;
  $("#date").value =
    b?.date || (day >= M.localDate(new Date()) ? day : M.localDate(new Date()));
  $("#time").value = b?.time || "";
  $("#editor").showModal();
}
function openPerson(p) {
  editingPerson = p?.id || null;
  $("#person-title").textContent = p ? "Editar cadastro" : "Novo cadastro";
  $("#person-name").value = p?.name || "";
  $("#person-phone").value = p?.phone || "";
  $("#person-error").textContent = "";
  $("#person-editor").showModal();
}
function error(err) {
  return err.message || "Não foi possível salvar. Tente novamente.";
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.tab) tab(b.dataset.tab);
  if (b.dataset.close) $("#" + b.dataset.close).close();
});
$("#new-booking").onclick = () => openEditor();
$("#new-person").onclick = () => openPerson();
$("#quick-person").onclick = () => openPerson();
$("#profile-open").onclick = openProfile;
$("#search-person").oninput = renderPeople;
$("#agenda-date").onchange = renderAgenda;
$("#status-filter").onchange = renderAgenda;
$("#today").onclick = () => {
  $("#agenda-date").value = M.localDate(new Date());
  renderAgenda();
};
$("#people-list").onclick = (e) => {
  const b = e.target.closest("button[data-person]");
  if (b) openPerson(state.people.find((p) => p.id === b.dataset.person));
};
$("#person-form").onsubmit = async (e) => {
  e.preventDefault();
  if (busy) return;
  $("#person-save").disabled = true;
  try {
    const p = M.person({
      id: editingPerson || uuid(),
      name: $("#person-name").value.trim(),
      phone: $("#person-phone").value.replace(/\D/g, ""),
    });
    if (
      !editingPerson &&
      p.phone &&
      state.people.some((x) => x.phone === p.phone)
    )
      throw Error(
        "Já há um cadastro com esse telefone. Procure na lista ou edite o cadastro existente.",
      );
    await persist({
      ...state,
      people: [...state.people.filter((x) => x.id !== p.id), p],
    });
    if ($("#editor").open) personOptions(p.id);
    $("#person-editor").close();
    announce("Cadastro salvo.");
  } catch (err) {
    $("#person-error").textContent = error(err);
  } finally {
    $("#person-save").disabled = false;
  }
};
$("#profile-form").onsubmit = async (e) => {
  e.preventDefault();
  if (busy) return;
  $("#profile-save").disabled = true;
  try {
    await persist({
      ...state,
      profile: {
        name: $("#profile-name").value.trim(),
        profession: $("#profession").value,
      },
    });
    $("#profile-editor").close();
    announce("Perfil salvo. Sua agenda está pronta.");
  } catch (err) {
    $("#profile-error").textContent = error(err);
  } finally {
    $("#profile-save").disabled = false;
  }
};
$("#booking-form").onsubmit = async (e) => {
  e.preventDefault();
  if (busy) return;
  $("#save").disabled = true;
  try {
    const b = {
      id: editing || uuid(),
      personId: $("#person").value,
      service: $("#service").value.trim(),
      duration: Number($("#duration").value),
      price: Number($("#price").value),
      date: $("#date").value,
      time: $("#time").value,
      status: "confirmed",
    };
    await persist(M.saveBooking(state, b));
    $("#agenda-date").value = b.date;
    $("#status-filter").value = "all";
    renderAgenda();
    $("#editor").close();
    tab("agenda");
    announce("Agendamento salvo no aparelho.");
  } catch (err) {
    $("#form-error").textContent = error(err);
  } finally {
    $("#save").disabled = false;
  }
};
$("#appointment-list").onclick = async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn || busy) return;
  const b = state.bookings.find((x) => x.id === btn.dataset.id);
  if (!b) return;
  const action = btn.dataset.action;
  if (action === "edit") return openEditor(b);
  if (
    !confirm(
      action === "cancel"
        ? "Cancelar este agendamento?"
        : "Marcar este atendimento como concluído?",
    )
  )
    return;
  try {
    await persist({
      ...state,
      bookings: state.bookings.map((x) =>
        x.id === b.id
          ? { ...x, status: action === "cancel" ? "cancelled" : "completed" }
          : x,
      ),
    });
    announce(
      action === "cancel" ? "Agendamento cancelado." : "Atendimento concluído.",
    );
  } catch (err) {
    announce(error(err));
  }
};
$("#export").onclick = async () => {
  try {
    await storage.exportBackup(
      JSON.stringify(
        {
          app: "agenda-em-dia",
          version: 1,
          createdAt: new Date().toISOString(),
          data: state,
        },
        null,
        2,
      ),
      `agenda-em-dia-${M.localDate(new Date())}-${Date.now()}.json`,
    );
    announce("Backup preparado. Salve o arquivo fora do app.");
  } catch (err) {
    announce("Backup não finalizado: " + error(err));
  }
};
$("#import").onclick = () => $("#backup-file").click();
$("#backup-file").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file || busy) return;
  try {
    if (file.size > 15 * 1024 * 1024) throw Error("O limite é 15 MB.");
    const next = M.parseBackup(await file.text());
    if (
      !confirm(
        `Restaurar ${next.people.length} cadastro(s) e ${next.bookings.length} agendamento(s)? Isso substituirá toda a agenda e o perfil atuais. Guarde um backup antes.`,
      )
    )
      return;
    await persist(next);
    announce("Backup restaurado com sucesso. Escolha a data desejada.");
    if (!state.profile.profession) openProfile();
  } catch (err) {
    announce("Backup não restaurado: " + error(err));
  } finally {
    e.target.value = "";
  }
};
async function init() {
  try {
    const raw = await storage.read();
    state = raw ? M.validate(JSON.parse(raw)) : M.initial();
    healthy = true;
  } catch (err) {
    $("#storage-warning").hidden = false;
    $("#storage-warning").textContent =
      "Não foi possível ler os dados. Nada foi sobrescrito. Reinicie o app ou restaure um backup válido. " +
      error(err);
  }
  buttons();
  render();
  if (healthy && !state.profile.profession) openProfile();
}
init();
