import { exec } from "child_process";
import { promisify } from "util";
import { Type } from "@google/genai";
import type { ToolDefinition } from "../toolRegistry";

const execAsync = promisify(exec);
const TIMEOUT_MS = 10_000;

export const shellTool: ToolDefinition = {
  risk: "high",

  schema: {
    name: "shell",
    description:
      "Executes a Linux shell command on the server. Use only when system-level data is needed.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: {
          type: Type.STRING,
          description: "The shell command to execute, e.g. 'df -h' or 'uptime'",
        },
      },
      required: ["command"],
    },
  },

  preview(args) {
    return `Run shell command: \`${args.command}\``;
  },

  async execute(args) {
    const command = args.command as string;
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: TIMEOUT_MS,
      });
      return stdout.trim() || stderr.trim() || "(no output)";
    } catch (err: any) {
      return `Error: ${err.message}`;
    }
  },
};