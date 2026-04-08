import { Context } from "telegraf";
import { mainKeyboard, confirmKeyboard, disksKeyboard } from "./keyboards";
import { commandRegistry } from "../commands/registry";
import { diskSection } from "./sections/diskSection";
import { dockerSection } from "./sections/dockerSection";
import { systemSection } from "./sections/systemSection";
import { statusSection } from "./sections/statusSection";
import type { PendingStore } from "./types";
import { getDiskStatusText, umountDisk } from "../services/disk.service";
import { networkSection } from "./sections/networkSection";

// ── Pending store ──────────────────────────────────────────────────────────
const _pending = new Map<number, string>();

const pending: PendingStore = {
  get: (id) => _pending.get(id),
  set: (id, cmd) => _pending.set(id, cmd),
  delete: (id) => _pending.delete(id),
};

// ── Секції — порядок важливий (перша яка canHandle виграє) ────────────────
const sections = [statusSection, diskSection, dockerSection, systemSection, networkSection];

// ── Публічні функції ───────────────────────────────────────────────────────

export function isMenuButton(text: string): boolean {
  return (
    isSystemButton(text) ||
    sections.some((s) => s.canHandle(text))
  );
}

export async function handleMenuButton(ctx: Context, text: string) {
  const chatId = ctx.chat!.id;

  // ── Системні кнопки (спільні для всіх секцій) ─────────────────────────
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

    // Спеціальні дії які не в commandRegistry
    if (command === "__umount_disk__") {
      await ctx.reply("⏳ Розмонтовую...");
      const result = await umountDisk();
      const [status, keyboard] = await Promise.all([
        getDiskStatusText(),
        disksKeyboard(),
      ]);
      await ctx.reply(result, { parse_mode: "Markdown" });
      await ctx.reply(status, { parse_mode: "Markdown", ...keyboard });
      return;
    }

    // Звичайні команди з реєстру
    await ctx.reply("⏳ Виконую...");
    const result = await commandRegistry.get(command)!.execute();
    await ctx.reply(result, { parse_mode: "Markdown", ...mainKeyboard() });
  }

  // ── Делегуємо секціям ─────────────────────────────────────────────────
  for (const section of sections) {
    if (section.canHandle(text)) {
      await section.handle(ctx, text, pending);
      return;
    }
  }
}

function isSystemButton(text: string): boolean {
  return ["⬅️ Головне меню", "✅ Так", "❌ Скасувати"].includes(text);
}