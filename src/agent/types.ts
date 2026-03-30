
export type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface PendingToolCall {
  name: string;
  args: Record<string, unknown>;
  preview: string; // показується юзеру: "Run: df -h"
}

export interface Session {
  messages: ChatMessage[];
  pendingToolCall?: PendingToolCall; // чекаємо yes/no
}

export interface LLMResponse {
  text?: string;
  toolCall?: {
    name: string;
    args: Record<string, unknown>;
  };
}