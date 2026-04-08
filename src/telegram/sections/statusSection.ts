import { commandRegistry } from "../../commands/registry";
import { mainKeyboard } from "../keyboards";
import type { MenuSection } from "../types";

export const statusSection: MenuSection = {
  canHandle: (text) => text === "📊 Статус",

  handle: async (ctx) => {
    await ctx.reply("⏳ Отримую статус...");
    const result = await commandRegistry.get("/status")!.execute();
    await ctx.reply(result, { parse_mode: "Markdown", ...mainKeyboard() });
  },
};