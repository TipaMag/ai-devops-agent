import { getDiskStatusText, mountDisk } from "../../services/disk.service";
import { confirmKeyboard, disksKeyboard } from "../keyboards";
import type { MenuSection, PendingStore } from "../types";

const BUTTONS = {
  OPEN:    "💾 Диски",
  REFRESH: "🔄 Оновити диски",
  MOUNT:   "🔌 Змонтувати диск",
  UMOUNT:  "⏏️ Розмонтувати диск",
};

export const diskSection: MenuSection = {
  canHandle: (text) => Object.values(BUTTONS).includes(text),

  handle: async (ctx, text, pending) => {
    if (text === BUTTONS.OPEN || text === BUTTONS.REFRESH) {
      const [status, keyboard] = await Promise.all([
        getDiskStatusText(),
        disksKeyboard(),
      ]);
      await ctx.reply(status, { parse_mode: "Markdown", ...keyboard });
      return;
    }

    if (text === BUTTONS.MOUNT) {
      const result = await mountDisk();
      const [status, keyboard] = await Promise.all([
        getDiskStatusText(),
        disksKeyboard(),
      ]);
      await ctx.reply(result, { parse_mode: "Markdown" });
      await ctx.reply(status, { parse_mode: "Markdown", ...keyboard });
      return;
    }

    if (text === BUTTONS.UMOUNT) {
      // high risk — через підтвердження
      pending.set(ctx.chat!.id, "__umount_disk__");
      await ctx.reply(
        "⚠️ Розмонтувати диск і відключити?\n\nПереконайся що ніхто не використовує файли.",
        { parse_mode: "Markdown", ...confirmKeyboard() }
      );
      return;
    }
  },
};