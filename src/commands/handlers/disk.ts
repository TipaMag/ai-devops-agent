import { exec } from "child_process";
import { promisify } from "util";
import type { CommandHandler } from "../types";

const execAsync = promisify(exec);

export const diskCommand: CommandHandler = {
  command: "/disk",
  description: "Вільне місце на дисках",
  risk: "low",

  async execute() {
    const { stdout } = await execAsync("df -h --output=source,size,used,avail,pcent,target");
    return `💾 *Диски:*\n\`\`\`\n${stdout.trim()}\n\`\`\``;
  },
};

export const mountCommand: CommandHandler = {
  command: "/mount",
  description: "Змонтувати зовнішній диск",
  risk: "high",
  confirmText: "⚠️ Змонтувати зовнішній диск `/dev/sdb1`?",

  async execute() {
    await execAsync("sudo mount /dev/sdb1 /mnt/external");
    return "✅ Диск змонтовано в /mnt/external";
  },
};

export const umountCommand: CommandHandler = {
  command: "/umount",
  description: "Розмонтувати зовнішній диск",
  risk: "high",
  confirmText: "⚠️ Розмонтувати `/mnt/external`?",

  async execute() {
    await execAsync("sudo umount /mnt/external");
    return "✅ Диск розмонтовано";
  },
};