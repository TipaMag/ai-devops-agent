import { Context } from "telegraf";
import { commandRegistry } from "../commands/registry";
import {
  mainKeyboard,
  disksKeyboard,
  systemKeyboard,
  confirmKeyboard,
  dockerKeyboard,
} from "./keyboards";
import { restartContainer } from "../commands/handlers/docker";

// telegram/menuRouter.ts

const SUBMENU: Record<string, () => any> = {
  "💾 Диски":   disksKeyboard,
  "⚙️ Система": systemKeyboard,
  "🐳 Докер":   dockerKeyboard,  // async — підтягує контейнери
};

const COMMANDS: Record<string, string> = {
  "📊 Статус":           "/status",
  "📋 Показати диски":   "/disk",
  "🔌 Змонтувати":       "/mount",
  "⏏️ Розмонтувати":     "/umount",
  "🔄 Перезавантажити":  "/reboot",
};

const pending = new Map<number, string>();

export function isMenuButton(text: string): boolean {
  return (
    text in SUBMENU ||
    text in COMMANDS ||
    text.startsWith("🔄 ") ||  // docker container restart
    ["⬅️ Головне меню", "✅ Так", "❌ Скасувати"].includes(text)
  );
}

export async function handleMenuButton(ctx: Context, text: string) {
  const chatId = ctx.chat!.id;

  if (text === "⬅️ Головне меню") {
    pending.delete(chatId);
    await ctx.reply("🏠 Головне меню", mainKeyboard());
    return;
  }

  if (text === "❌ Скасувати") {
    pending.delete(chatId);
    await ctx.reply("❌ Скасовано.", mainKeyboard());
    return;
  }

  if (text === "✅ Так") {
    const command = pending.get(chatId);
    if (!command) return;
    pending.delete(chatId);
    await ctx.reply("⏳ Виконую...");
    const result = await commandRegistry.get(command)!.execute();
    await ctx.reply(result, { parse_mode: "Markdown", ...mainKeyboard() });
    return;
  }

  // Навігація в підменю
  if (text in SUBMENU) {
    const keyboard = await SUBMENU[text]();
    await ctx.reply(text, keyboard);
    return;
  }

  // Docker — рестарт контейнера по кнопці
  if (text.startsWith("🔄 ") && text !== "🔄 Перезавантажити") {
    const name = text.slice(3);
    await ctx.reply("⏳ Перезапускаю...");
    const result = await restartContainer(name);
    await ctx.reply(result, { parse_mode: "Markdown", ...await dockerKeyboard() });
    return;
  }

  // Виконання команди
  if (text in COMMANDS) {
    const command = COMMANDS[text];
    const def = commandRegistry.get(command)!;

    if (def.risk === "high") {
      pending.set(chatId, command);
      await ctx.reply(def.confirmText!, {
        parse_mode: "Markdown",
        ...confirmKeyboard(),
      });
      return;
    }

    await ctx.reply("⏳ Виконую...");
    const result = await def.execute();
    await ctx.reply(result, { parse_mode: "Markdown", ...mainKeyboard() });
  }
}