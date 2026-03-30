import { GoogleGenAI } from "@google/genai";
import { config } from "../config";
import { ChatMessage, LLMResponse } from "../agent/types";
import { getToolSchemas } from "../agent/toolRegistry";

const geminiAI = new GoogleGenAI({ apiKey: config.geminiKey });

export async function callLLM(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<LLMResponse> {

  const response = await geminiAI.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: getToolSchemas() }],
    },
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  });

  const candidate = response.candidates?.[0]?.content;

  // LLM хоче викликати тул
  const fnCall = candidate?.parts?.find((p) => p.functionCall);
  if (fnCall?.functionCall) {
    return {
      toolCall: {
        name: fnCall.functionCall.name!,
        args: (fnCall.functionCall.args ?? {}) as Record<string, unknown>,
      },
    };
  }

  // Текстова відповідь
  const text =
    candidate?.parts
      ?.filter((p) => p.text)
      .map((p) => p.text!)
      .join("")
      .trim() ?? "";

  return { text };
}