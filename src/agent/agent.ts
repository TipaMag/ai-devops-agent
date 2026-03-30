
import { callLLM } from "../llm/llm.service";
import { toolRegistry } from "./toolRegistry";
import { evaluatePolicy } from "./policy";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { Session, ChatMessage } from "./types";

const MAX_MESSAGES = 40;
const MAX_TOOL_DEPTH = 5; // максимум послідовних тул-викликів за один turn

const CONFIRM_KEYWORDS = new Set(["yes", "так", "y", "підтверджую", "ok"]);
const DENY_KEYWORDS = new Set(["no", "ні", "n", "скасувати", "cancel"]);

export async function handleAgentMessage(
  session: Session,
  userText: string
): Promise<{ messageText: string; session: Session }> {

  // ── 1. Обробка pending підтвердження ──────────────────────────────────
  if (session.pendingToolCall) {
    const normalized = userText.trim().toLowerCase();

    if (DENY_KEYWORDS.has(normalized)) {
      const newSession: Session = {
        messages: session.messages,
        pendingToolCall: undefined,
      };
      return { messageText: "❌ Команду скасовано.", session: newSession };
    }

    if (CONFIRM_KEYWORDS.has(normalized)) {
      const { name, args } = session.pendingToolCall;
      const tool = toolRegistry[name];
      const result = await tool.execute(args);

      const messagesWithResult: ChatMessage[] = [
        ...session.messages,
        {
          role: "user",
          content: `[Tool result: ${name}]\n${result}`
        },
      ];

      const response = await callLLM(messagesWithResult, SYSTEM_PROMPT);
      const messageText = response.text ?? "";

      const finalMessages: ChatMessage[] = [
        ...messagesWithResult,
        { role: "assistant", content: messageText },
      ];

      return {
        messageText,
        session: {
          messages: trimMessages(finalMessages),
          pendingToolCall: undefined,
        },
      };
    }

    // Не зрозуміла відповідь — перепитуємо
    return {
      messageText: `⚠️ Відповідь незрозуміла. Введіть *yes* для підтвердження або *no* для скасування.\n\n${session.pendingToolCall.preview}`,
      session,
    };
  }

  // ── 2. Звичайний flow з tool depth ────────────────────────────────────
  let messages: ChatMessage[] = [
    ...session.messages,
    { role: "user", content: userText },
  ];

  let toolDepth = 0;
  let messageText = "";

  while (toolDepth <= MAX_TOOL_DEPTH) {
    const response = await callLLM(messages, SYSTEM_PROMPT);

    // Текстова відповідь — завершуємо
    if (response.text !== undefined) {
      messageText = response.text;
      messages.push({ role: "assistant", content: messageText });
      break;
    }

    // Tool call
    if (response.toolCall) {
      const { name, args } = response.toolCall;
      const policy = evaluatePolicy(name, args);

      if (policy.action === "deny") {
        messageText = `🚫 ${policy.reason}`;
        messages.push({ role: "assistant", content: messageText });
        break;
      }

      if (policy.action === "confirm") {
        // Зберігаємо pending і просимо підтвердження
        const confirmText =
          `⚠️ Потрібне підтвердження:\n\n\`${policy.preview}\`\n\nВведіть *yes* для виконання або *no* для скасування.`;

        return {
          messageText: confirmText,
          session: {
            messages: trimMessages(messages),
            pendingToolCall: { name, args, preview: policy.preview },
          },
        };
      }

      // low risk — виконуємо одразу
      const tool = toolRegistry[name];
      const result = await tool.execute(args);
      messages.push({
        role: "user",
        content: `[Tool result: ${name}]\n${result}`
      });

      toolDepth++;
      continue;
    }

    // Якщо відповідь порожня
    messageText = "🤖 Не вдалося отримати відповідь.";
    break;
  }

  if (toolDepth > MAX_TOOL_DEPTH) {
    messageText = "⚠️ Досягнуто ліміт викликів інструментів.";
  }

  return {
    messageText,
    session: {
      messages: trimMessages(messages),
      pendingToolCall: undefined,
    },
  };
}

function trimMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.length > MAX_MESSAGES
    ? messages.slice(-MAX_MESSAGES)
    : messages;
}





// import { callLLM } from "../llm/llm.service";
// import { routeToolCall } from "./toolRouter";
// import { SYSTEM_PROMPT } from "./systemPrompt";
// import { Session, ToolCall, LLMResponse, ChatMessage } from "./types";

// const MAX_MESSAGES = 20;


// function tryParseToolCall(text: string): ToolCall | null {
//   try {
//     const parsed = JSON.parse(text);

//     if (parsed?.action === "tool" && parsed.tool) {
//       return parsed as ToolCall;
//     }

//     return null;
//   } catch {
//     return null;
//   }
// }

// export async function handleAgentMessage(
//   session: Session,
//   userText: string
// ): Promise<{ messageText: string; session: Session }> {

//   const updatedSession: Session = {
//     messages: [...session.messages, { role: "user", content: userText }]
//   };

//   let response: LLMResponse = await callLLM([
//     { role: "system", content: SYSTEM_PROMPT },
//     ...updatedSession.messages
//   ]);

//   let messageText = response.text ?? "";

//   const toolCall = tryParseToolCall(messageText);

//   if (toolCall) {
//     const toolResult = await routeToolCall(toolCall);

//     updatedSession.messages.push({
//       role: "tool",
//       content: toolResult
//     });

//     response = await callLLM([
//       { role: "system", content: SYSTEM_PROMPT },
//       ...updatedSession.messages
//     ]);

//     messageText = response.text ?? "";
//   }

//   updatedSession.messages.push({
//     role: "assistant",
//     content: messageText
//   });

//   // 🔥 Trim history
//   if (updatedSession.messages.length > MAX_MESSAGES) {
//     updatedSession.messages =
//       updatedSession.messages.slice(-MAX_MESSAGES);
//   }

//   return { messageText, session: updatedSession };
// }