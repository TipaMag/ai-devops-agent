import { toolRegistry, RiskLevel } from "./toolRegistry";

export type PolicyDecision =
  | { action: "execute" }
  | { action: "confirm"; preview: string }
  | { action: "deny"; reason: string };

export function evaluatePolicy(
  toolName: string,
  args: Record<string, unknown>
): PolicyDecision {
  const tool = toolRegistry[toolName];

  if (!tool) {
    return { action: "deny", reason: `Unknown tool: ${toolName}` };
  }

  if (tool.risk === "low") {
    return { action: "execute" };
  }

  // high risk → потребує підтвердження
  return {
    action: "confirm",
    preview: tool.preview(args),
  };
}