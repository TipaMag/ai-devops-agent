import { Markup } from "telegraf";
import { getRunningContainers } from "../commands/handlers/docker";

// mainKeyboard
export const mainKeyboard = () =>
  Markup.keyboard([
    ["📊 Статус", "💾 Диски"],
    ["⚙️ Система", "🐳 Докер"],
  ])
    .resize()
    .persistent(); // persistent() підтримується в нових версіях Telegram

// disksKeyboard
export const disksKeyboard = () =>
  Markup.keyboard([
    ["📋 Показати диски"],
    ["🔌 Змонтувати", "⏏️ Розмонтувати"],
    ["⬅️ Головне меню"],
  ])
    .resize()
    .persistent();

// systemKeyboard
export const systemKeyboard = () =>
  Markup.keyboard([
    ["🔄 Перезавантажити"],
    ["⬅️ Головне меню"],
  ])
    .resize()
    .persistent();

// Динамічна клавіатура — кнопки з реальними іменами контейнерів
export async function dockerKeyboard() {
  const containers = await getRunningContainers();

  const containerButtons = containers.map((name) => [`🔄 ${name}`]);

  return Markup.keyboard([
    ["🐳 Статус контейнерів"],
    ...containerButtons,
    ["⬅️ Головне меню"],
  ])
    .resize()
    .persistent();
}

// confirmKeyboard
export const confirmKeyboard = () =>
  Markup.keyboard([
    ["✅ Так", "❌ Скасувати"],
  ])
    .resize()
    .oneTime(); // зникне після вибору варіанту
