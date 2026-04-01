import { CommandHandler } from "./types";
import { statusCommand } from "./handlers/status";
import { rebootCommand, } from "./handlers/system";
import { diskCommand, mountCommand, umountCommand } from "./handlers/disk";

const commandHandlers: CommandHandler[] = [
  statusCommand,
  rebootCommand,
  diskCommand,
  mountCommand,
  umountCommand,
];

export const commandRegistry = new Map(
  commandHandlers.map((c) => [c.command, c])
);

export function getHelpText(): string {
  return commandHandlers
    .map((c) => `${c.command} — ${c.description}`)
    .join("\n");
}