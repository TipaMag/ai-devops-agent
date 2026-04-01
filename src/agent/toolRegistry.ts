import { shellTool } from "./tools/shell.tool";
import { Type } from "@google/genai";

export type RiskLevel = "low" | "high";

export interface ToolDefinition {
  risk: RiskLevel;
  // Gemini function declaration — передається в API як є
  schema: {
    name: string;
    description: string;
    parameters: {
      type: Type.OBJECT;
      properties: Record<string, { type: Type; description: string }>;
      required?: string[];
    };
  };

  // Що покажемо юзеру перед виконанням high-risk команди
  preview(args: Record<string, unknown>): string;

  execute(args: Record<string, unknown>): Promise<string>;
}

export const toolRegistry: Record<string, ToolDefinition> = {
  shell: shellTool,
  // docker: dockerTool,
};

// Повертаємо схеми для Gemini API
export function getToolSchemas() {
  return Object.values(toolRegistry).map((t) => ({
    name: t.schema.name,
    description: t.schema.description,
    parameters: t.schema.parameters,
  }));
}