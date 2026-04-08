import { getNetworkInfo, runSpeedtest } from "../../services/network.service";
import { networkKeyboard, mainKeyboard } from "../keyboards";
import type { MenuSection } from "../types";

const BUTTONS = {
  OPEN:      "🌐 Мережа",
  REFRESH:   "🔄 Оновити мережу",
  SPEEDTEST: "📶 Speedtest",
};

export const networkSection: MenuSection = {
  canHandle: (text) => Object.values(BUTTONS).includes(text),

  handle: async (ctx, text) => {
    if (text === BUTTONS.OPEN || text === BUTTONS.REFRESH) {
      const info = await getNetworkInfo();
      await ctx.reply(info, {
        parse_mode: "Markdown",
        ...networkKeyboard(),
      });
      return;
    }

    if (text === BUTTONS.SPEEDTEST) {
      await ctx.reply("⏳ Запускаю speedtest, це займе ~10 секунд...");
      const result = await runSpeedtest();
      await ctx.reply(result, {
        parse_mode: "Markdown",
        ...networkKeyboard(),
      });
      return;
    }
  },
};