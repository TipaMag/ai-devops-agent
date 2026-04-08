import type { CommandHandler } from "../types";
import { execOnHost } from "../../services/host.service";


export const rebootCommand: CommandHandler = {
  command: "/reboot",
  description: "Перезавантажити сервер",
  risk: "high",
  confirmText: "⚠️ Ти впевнений що хочеш *перезавантажити сервер*?",

  async execute() {
    await execOnHost("reboot");
    return "🔄 Сервер перезавантажується...";
  },
};