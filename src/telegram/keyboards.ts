import { Markup } from "telegraf";
import { getDiskState } from "../services/disk.service";
import { listContainers } from "../services/docker.service";

export const mainKeyboard = () =>
  Markup.keyboard([
    ["📊 Статус", "💾 Диски"],
    ["⚙️ Система", "🐳 Докер"],
    ["🌐 Мережа"],
  ])
    .resize()
    .persistent();

export async function disksKeyboard() {
  const state = await getDiskState();

  const actionButton =
    state.status === "disconnected"
      ? []
      : state.status === "unmounted"
        ? [["🔌 Змонтувати диск"]]
        : [["⏏️ Розмонтувати диск"]];

  return Markup.keyboard([
    ["🔄 Оновити диски"],
    ...actionButton,
    ["⬅️ Головне меню"],
  ])
    .resize()
    .persistent();
}

export const systemKeyboard = () =>
  Markup.keyboard([["🔄 Перезавантажити"], ["⬅️ Головне меню"]])
    .resize()
    .persistent();

export async function dockerKeyboard() {
  const containers = await listContainers();

  const rows = containers.map((c) => {
    const name = c.Names[0].replace("/", "");
    const icon = c.State === "running" ? "🟢" : "🔴";
    const status = c.Status;

    return [`${icon} ${name} (${status}) - 🔄`];
  });

  return Markup.keyboard([
    ...rows,
    ["🔄 Оновити контейнери"],
    ["⬅️ Головне меню"],
  ])
    .resize()
    .persistent();
}

export const networkKeyboard = () =>
  Markup.keyboard([
    ["📶 Speedtest", "🔄 Оновити мережу"],
    ["⬅️ Головне меню"],
  ])
    .resize()
    .persistent();

export const confirmKeyboard = () =>
  Markup.keyboard([["✅ Так", "❌ Скасувати"]])
    .resize()
    .oneTime(); // зникне після вибору варіанту
