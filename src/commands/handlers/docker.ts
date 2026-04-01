import Dockerode from "dockerode";
import type { CommandHandler } from "../types";

const docker = new Dockerode({ socketPath: "/var/run/docker.sock" });

// Список контейнерів — повертає дані для динамічних кнопок
export const dockerListCommand: CommandHandler = {
  command: "/docker",
  description: "Список Docker контейнерів",
  risk: "low",

  async execute() {
    const containers = await docker.listContainers({ all: true });

    if (containers.length === 0) {
      return "🐳 Контейнерів не знайдено.";
    }

    const lines = containers.map((c) => {
      const name = c.Names[0].replace("/", "");
      const status = c.State === "running" ? "🟢" : "🔴";
      return `${status} *${name}* — ${c.Status}`;
    });

    return `🐳 *Docker контейнери:*\n\n${lines.join("\n")}`;
  },
};

// Рестарт конкретного контейнера
export async function restartContainer(name: string): Promise<string> {
  try {
    const container = docker.getContainer(name);
    await container.restart();
    return `✅ Контейнер *${name}* перезапущено.`;
  } catch (err: any) {
    return `❌ Помилка: ${err.message}`;
  }
}

// Для динамічних кнопок — повертає список запущених контейнерів
export async function getRunningContainers(): Promise<string[]> {
  const containers = await docker.listContainers({ all: true });
  return containers.map((c) => c.Names[0].replace("/", ""));
}