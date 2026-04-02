import { exec } from "child_process";
import { promisify } from "util";
import { Type } from "@google/genai";
import type { ToolDefinition } from "../toolRegistry";

const execAsync = promisify(exec);
const TIMEOUT_MS = 10_000;

// ❌ Заборонені ключові слова
const FORBIDDEN_PATTERNS = [
  /rm\s+-rf\s+\//,
  /shutdown/,
  /reboot/,
  /poweroff/,
  /mkfs/,
  /dd\s+/,
  /:\(\)\s*\{\s*:\|\:&\s*\};:/, // fork bomb
  /chmod\s+777\s+\//,
  /chown\s+/,
  /kill\s+/,
  /killall\s+/,
  /mount\s+/,
  /umount\s+/,
];

// ❌ Заборонені символи (ланцюжки команд)
const FORBIDDEN_CHARS = [
  ";",
  "&&",
  "||",
  "|",
  "`",
  "$(",
  ">",
  "<",
];

// ✅ Дозволені команди (білий список)
const ALLOWED_PATTERNS: RegExp[] = [
  /^df -h$/,
  /^uptime$/,
  /^free -m$/,
  /^lsblk$/,
  /^lsblk -f$/,
  /^ps aux$/,
  /^top -b -n 1$/,
  /^whoami$/,
  /^uname -a$/,
  /^docker ps$/,
];

// 🧹 sanitize
function sanitize(command: string): string {
  return command.trim().replace(/\s+/g, " ");
}

// 🔒 головна перевірка
function validate(command: string): string | null {
  if (!command) return "Empty command";

  if (command.length > 200) {
    return "Command too long";
  }

  if (command.includes("\n")) {
    return "Multiline commands are not allowed";
  }

  // ❌ символи
  for (const char of FORBIDDEN_CHARS) {
    if (command.includes(char)) {
      return `Forbidden symbol detected: ${char}`;
    }
  }

  // ❌ патерни
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(command)) {
      return `Forbidden command detected`;
    }
  }

  // ✅ allowlist
  const isAllowed = ALLOWED_PATTERNS.some((r) => r.test(command));

  if (!isAllowed) {
    return "Command is not allowed";
  }

  return null;
}

export const shellTool: ToolDefinition = {
  risk: "high",

  schema: {
    name: "shell",
    description:
      "Executes a SAFE Linux command (read-only diagnostics).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: {
          type: Type.STRING,
          description:
            "Allowed commands: df -h, uptime, free -m, lsblk, ps aux, docker ps",
        },
      },
      required: ["command"],
    },
  },

  preview(args) {
    return `Run SAFE shell command: \`${args.command}\``;
  },

  async execute(args) {
    const raw = args.command as string;
    const command = sanitize(raw);

    const error = validate(command);
    if (error) {
      return `❌ Blocked: ${error}`;
    }

    console.log("SAFE SHELL:", command);
    // 🔒 escape тільки лапок
    const safeCommand = command.replace(/"/g, '\\"');

    try {
      const { stdout, stderr } = await execAsync(
        `chroot /host sh -c "${safeCommand}"`,
        { timeout: TIMEOUT_MS }
      );

      return stdout.trim() || stderr.trim() || "(no output)";
    } catch (err: any) {
      return `❌ Error: ${err.message}`;
    }
  }
};