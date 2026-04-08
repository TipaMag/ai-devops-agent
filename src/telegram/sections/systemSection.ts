import { commandRegistry } from "../../commands/registry";
import { systemKeyboard, confirmKeyboard, mainKeyboard } from "../keyboards";
import type { MenuSection, PendingStore } from "../types";

const BUTTONS: Record<string, string> = {
  "⚙️ Система":          "submenu",
  "🔄 Перезавантажити":  "/reboot",
};

export const systemSection: MenuSection = {
  canHandle: (text) => text in BUTTONS,

  handle: async (ctx, text, pending) => {
    if (text === "⚙️ Система") {
      await ctx.reply("⚙️ Система", systemKeyboard());
      return;
    }

    const command = BUTTONS[text];
    const def = commandRegistry.get(command);
    if (!def) return;

    if (def.risk === "high") {
      pending.set(ctx.chat!.id, command);
      await ctx.reply(def.confirmText!, {
        parse_mode: "Markdown",
        ...confirmKeyboard(),
      });
      return;
    }

    await ctx.reply("⏳ Виконую...");
    const result = await def.execute();
    await ctx.reply(result, { parse_mode: "Markdown", ...mainKeyboard() });
  },
};