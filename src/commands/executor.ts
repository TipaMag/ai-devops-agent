import { commandRegistry } from "./registry";
import { PendingCommand } from "./types";
import { Session } from "../agent/types";

const CONFIRM = new Set(["yes", "так", "y", "ok"]);
const DENY = new Set(["no", "ні", "n", "cancel"]);

export type CommandResult = {
  text: string;
  pendingCommand?: PendingCommand;
};

// Виконання команди з перевіркою ризику
export async function executeCommand(
  command: string,
  session: Session
): Promise<{ result: CommandResult; session: Session }> {

  const def = commandRegistry.get(command);

  if (!def) {
    return {
      result: { text: `❓ Невідома команда. Введи /help` },
      session,
    };
  }

  if (def.risk === "high") {
    return {
      result: {
        text: `${def.confirmText}\n\nВведи *yes* або *no*`,
        pendingCommand: { command: def.command, confirmText: def.confirmText! },
      },
      session: { ...session, pendingCommand: { command: def.command, confirmText: def.confirmText! } },
    };
  }

  const text = await def.execute();
  return { result: { text }, session };
}

// Обробка відповіді на підтвердження
export async function handleCommandConfirm(
  userText: string,
  session: Session
): Promise<{ result: CommandResult; session: Session }> {

  const normalized = userText.trim().toLowerCase();
  const { pendingCommand } = session;
  const cleanSession = { ...session, pendingCommand: undefined };

  if (DENY.has(normalized)) {
    return { result: { text: "❌ Скасовано." }, session: cleanSession };
  }

  if (CONFIRM.has(normalized)) {
    const def = commandRegistry.get(pendingCommand!.command)!;
    const text = await def.execute();
    return { result: { text }, session: cleanSession };
  }

  // незрозуміла відповідь — залишаємо pending
  return {
    result: {
      text: `⚠️ Введи *yes* або *no*\n\n${pendingCommand!.confirmText}`,
      pendingCommand: pendingCommand,
    },
    session,
  };
}