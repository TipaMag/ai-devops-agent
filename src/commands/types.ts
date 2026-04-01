export type CommandRisk = "low" | "high";

export interface CommandHandler {
  command: string;          // "/status"
  description: string;      // показується в /help
  risk: CommandRisk;
  confirmText?: string;     // текст підтвердження для high risk
  execute(): Promise<string>;
}

export interface PendingCommand {
  command: string;
  confirmText: string;
}