import { restartDockerCommand } from "../../commands/handlers/docker";
import { dockerKeyboard } from "../keyboards";
import type { MenuSection } from "../types";

const BUTTONS = {
  OPEN: "🐳 Докер",
  REFRESH: "🔄 Оновити контейнери",
};

function extractContainerName(text: string): string | null {
  // видаляємо перший "блок" (emoji + пробіл)
  const parts = text.split(" ");
  if (parts.length < 2) return null;
  // друге слово — це ім’я контейнера
  return parts[1];
}

export const dockerSection: MenuSection = {
  canHandle: (text) =>
    text === BUTTONS.OPEN ||
    text === BUTTONS.REFRESH ||
    text.startsWith("🟢 ") ||
    text.startsWith("🔴 "),

  handle: async (ctx, text) => {
    if (text === BUTTONS.OPEN || text === BUTTONS.REFRESH) {
      await ctx.reply("🐳 Docker", await dockerKeyboard());
      return;
    }

    const name = extractContainerName(text);
    
    if (name) {
      await ctx.reply(`⏳ Перезапускаю *${name}*...`, {
        parse_mode: "Markdown",
      });

      const result = await restartDockerCommand.execute({ name });

      await ctx.reply(result, {
        parse_mode: "Markdown",
        ...(await dockerKeyboard()), // оновлюємо список
      });

      return;
    }
  },
};
