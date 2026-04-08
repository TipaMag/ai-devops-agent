import type { CommandHandler } from "../types";
import { getDiskStatusText } from "../../services/disk.service";


// ── DISK ─────────────────────────────────────────────
export const diskCommand: CommandHandler = {
  command: "/disk",
  description: "Стан зовнішнього диска",
  risk: "low",

  async execute() {
    try {
      return await getDiskStatusText();
    } catch (err: any) {
      console.error("diskCommand error:", err);
      return "❌ Помилка отримання стану диска";
    }
  },
};