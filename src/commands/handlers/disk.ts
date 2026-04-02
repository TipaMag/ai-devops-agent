import { exec } from "child_process";
import { promisify } from "util";
import type { CommandHandler } from "../types";

const execAsync = promisify(exec);

// ── DISK ─────────────────────────────────────────────
export const diskCommand: CommandHandler = {
  command: "/disk",
  description: "Вільне місце на дисках",
  risk: "low",

  async execute() {
    try {
      const { stdout } = await execAsync(
        `chroot /host sh -c "df -h"`
      );

      return `💾 *Диски:*\n\`\`\`\n${stdout.trim()}\n\`\`\``;
    } catch (err: any) {
      console.error("diskCommand error:", err);
      return `❌ Помилка отримання дисків: ${err.message}`;
    }
  }
};

// ── MOUNT ────────────────────────────────────────────
export const mountCommand: CommandHandler = {
  command: "/mount",
  description: "Змонтувати зовнішній диск",
  risk: "high",
  confirmText: "⚠️ Змонтувати зовнішній диск `/dev/sdb1`?",

  async execute() {
    try {
      const { stdout, stderr } = await execAsync(
        `chroot /host sh -c "mount /dev/sdb1 /mnt/external"`
      );

      return `✅ Диск змонтовано\n${stdout || stderr}`;
    } catch (err: any) {
      console.error("mountCommand error:", err);
      return `❌ Помилка монтування: ${err.message}`;
    }
  },
};

// ── UMOUNT ───────────────────────────────────────────
export const umountCommand: CommandHandler = {
  command: "/umount",
  description: "Розмонтувати зовнішній диск",
  risk: "high",
  confirmText: "⚠️ Розмонтувати `/mnt/external`?",

  async execute() {
    try {
      const { stdout, stderr } = await execAsync(
        `chroot /host sh -c "umount /mnt/external"`
      );

      return `✅ Диск розмонтовано\n${stdout || stderr}`;
    } catch (err: any) {
      console.error("umountCommand error:", err);
      return `❌ Помилка розмонтування: ${err.message}`;
    }
  },
};