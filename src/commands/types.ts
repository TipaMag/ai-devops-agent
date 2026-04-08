export type CommandRisk = "low" | "high";

export interface CommandHandler<TArgs = void> {
  command: string; // "/status"
  description: string; // показується в /help
  risk: CommandRisk;
  confirmText?: string; // текст підтвердження для high risk

  execute: TArgs extends void
    ? () => Promise<string>
    : (args: TArgs) => Promise<string>;
}

export interface PendingCommand {
  command: string;
  confirmText: string;
}
