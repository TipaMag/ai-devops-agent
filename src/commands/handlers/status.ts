import si from "systeminformation";
import type { CommandHandler } from "../types";

export const statusCommand: CommandHandler = {
  command: "/status",
  description: "Статус сервера — uptime, CPU, пам'ять, температура",
  risk: "low",

  async execute() {
    const [cpu, mem, temp, load, osInfo, timeInfo] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.cpuTemperature(),
      si.currentLoad(),
      si.osInfo(),
      si.time(), // Додано сюди
    ]);

    const toGb = (bytes: number) => (bytes / 1024 ** 3).toFixed(1);
    const tempStr = temp.main ? `🌡 *Температура:* ${temp.main}°C\n` : "";

    return (
      `🖥 *Статус сервера*\n\n` +
      `*OS:* ${osInfo.distro} ${osInfo.release}\n` +
      `*Uptime:* ${formatUptime(timeInfo.uptime)}\n\n` +
      `⚙️ *CPU:* ${cpu.manufacturer} ${cpu.brand}\n` +
      `📊 *Завантаження:* ${load.currentLoadUser.toFixed(1)}%\n` +
      tempStr +
      `\n💾 *Пам'ять:*\n` +
      `Всього: ${toGb(mem.total)} GB\n` +
      `Використано: ${toGb(mem.used)} GB\n` +
      `Вільно: ${toGb(mem.available)} GB`
    );
  },
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [d && `${d}д`, h && `${h}г`, m && `${m}хв`].filter(Boolean).join(" ");
}