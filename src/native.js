import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { createCsv, createPdf } from "./reports.js";
const native = Capacitor.isNativePlatform(),
  key = "agenda-em-dia-v1";
async function saveFile(data, filename, type, base64 = false) {
  if (native) {
    const options = { path: filename, data, directory: Directory.Cache };
    if (!base64) options.encoding = Encoding.UTF8;
    const file = await Filesystem.writeFile(options);
    await Share.share({
      title: filename,
      url: file.uri,
      dialogTitle: "Salvar / compartilhar arquivo",
    });
    return;
  }
  const bytes = base64
    ? Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
    : data;
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
window.AgendaNative = {
  async read() {
    return native
      ? (await Preferences.get({ key })).value
      : localStorage.getItem(key);
  },
  async write(value) {
    if (native) await Preferences.set({ key, value });
    else localStorage.setItem(key, value);
  },
  async exportBackup(text, filename) {
    await saveFile(text, filename, "application/json");
  },
};
window.AgendaReports = {
  async pdf(report, filename) {
    await saveFile(createPdf(report), filename, "application/pdf", true);
  },
  async csv(report, filename) {
    await saveFile(createCsv(report), filename, "text/csv;charset=utf-8");
  },
};
