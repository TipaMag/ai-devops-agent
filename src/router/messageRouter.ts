import { Session } from "../agent/types";
import { handleAgentMessage } from "../agent/agent";
import { executeCommand, handleCommandConfirm } from "../commands/executor";
import { getHelpText } from "../commands/registry";

export type RouterResult = {
  text: string;
  session: Session;
};

export async function routeMessage(
  userText: string,
  session: Session
): Promise<RouterResult> {

  const trimmed = userText.trim();

  // ── /help — окремо, без реєстру ───────────────────────────────────────
  if (trimmed === "/help") {
    return { text: `📋 *Команди:*\n\n${getHelpText()}`, session };
  }

  // ── Pending підтвердження команди ─────────────────────────────────────
  if (session.pendingCommand) {
    const { result, session: newSession } = await handleCommandConfirm(trimmed, session);
    return { text: result.text, session: newSession };
  }

  // ── Slash команда ─────────────────────────────────────────────────────
  if (trimmed.startsWith("/")) {
    const command = trimmed.split(" ")[0]; // "/status args" → "/status"
    const { result, session: newSession } = await executeCommand(command, session);
    return { text: result.text, session: newSession };
  }

  // ── Агент ─────────────────────────────────────────────────────────────
  const { messageText, session: newSession } = await handleAgentMessage(session, trimmed);
  return { text: messageText, session: newSession };
}