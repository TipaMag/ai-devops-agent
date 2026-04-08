import type { CommandHandler } from "../types";
import { listContainers, restartContainer } from "../../services/docker.service";


// export const dockerListCommand: CommandHandler = {
//   command: "/docker",
//   description: "Список Docker контейнерів",
//   risk: "low",

//   async execute() {
//     try {
//       const containers = await listContainers();

//       if (!containers.length) {
//         return "🐳 Контейнерів не знайдено.";
//       }

//       return `🐳 *Docker контейнери:*\n\n` +
//         containers.map((c) => {
//           const name = c.Names[0].replace("/", "");
//           const status = c.State === "running" ? "🟢" : "🔴";
//           return `${status} *${name}* — ${c.Status}`;
//         }).join("\n");

//     } catch (err: any) {
//       return `❌ ${err.message}`;
//     }
//   },
// };

// 🔄 RESTART
export const restartDockerCommand: CommandHandler<{ name: string }> = {
  command: "docker_restart",
  description: "Restart container",
  risk: "high",

  async execute({ name }) {
    try {
      await restartContainer(name);
      return `✅ Контейнер *${name}* перезапущено.`;
    } catch (err: any) {
      return `❌ ${err.message}`;
    }
  },
};