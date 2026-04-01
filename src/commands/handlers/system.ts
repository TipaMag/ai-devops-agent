import { exec } from "child_process";
import { promisify } from "util";
import type { CommandHandler } from "../types";

const execAsync = promisify(exec);

export const rebootCommand: CommandHandler = {
  command: "/reboot",
  description: "Перезавантажити сервер",
  risk: "high",
  confirmText: "⚠️ Ти впевнений що хочеш *перезавантажити сервер*?",

  async execute() {
    await execAsync("sudo reboot");
    return "🔄 Сервер перезавантажується...";
  },
};