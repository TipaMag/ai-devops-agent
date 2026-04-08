import si from "systeminformation";
import type { CommandHandler } from "../types";
import { progressBar } from "../../services/disk.service";
import { execOnHost } from "../../services/host.service";


const toGb = (bytes: number) => (bytes / 1024 ** 3).toFixed(1);

export const statusCommand: CommandHandler = {
  command: "/status",
  description: "Статус сервера — uptime, CPU, пам'ять, температура",
  risk: "low",

  async execute() {
    const [cpu, mem, load, osInfo, timeInfo, fsSize] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.currentLoad(),
      si.osInfo(),
      si.time(),
      si.fsSize(),
    ]);

    // 1. Формуємо блок OS та Uptime
    const kernelStr = osInfo.kernel ? ` (kernel ${osInfo.kernel})` : "";
    const header =
      `🖥 *Статус сервера*\n\n` +
      `*OS:* ${osInfo.distro} ${osInfo.release}${kernelStr}\n` +
      `*Uptime:* ${formatUptime(timeInfo.uptime)}\n\n`;

    // 2. Блок CPU та Температури
    const tempValue = await getCpuTemp();
    const tempStr = tempValue ? `🌡 *Температура:* ${tempValue}°C\n` : "";
    const cpuBlock =
      `⚙️ *CPU:* ${cpu.brand}\n` +
      `📊 *Завантаження:* ${load.currentLoadUser.toFixed(1)}%\n` +
      tempStr;

    // 3. Блок Пам'яті (RAM + Swap)
    const ramPercent = Math.round((mem.active / mem.total) * 100);
    let memBlock = `\n💾 ${getStatusEmoji(ramPercent)} *RAM:* ${progressBar(ramPercent)} ${ramPercent}% ${toGb(mem.active)}/${toGb(mem.total)} GB`;

    if (mem.swaptotal > 0) {
      const swapPercent = Math.round((mem.swapused / mem.swaptotal) * 100);
      memBlock += `\n🔄 ${getStatusEmoji(swapPercent)} *Swap:* ${progressBar(swapPercent)} ${swapPercent}% ${toGb(mem.swapused)}/${toGb(mem.swaptotal)} GB`;
    }

    // 4. Блок Диска
    const rootFs = fsSize.find((f) => f.mount === "/");
    const diskBlock = rootFs
      ? `\n💿 ${getStatusEmoji(Math.round(rootFs.use))} *Диск:* ${progressBar(Math.round(rootFs.use))} ${Math.round(rootFs.use)}% ${toGb(rootFs.used)}/${toGb(rootFs.size)} GB`
      : "";

    return header + cpuBlock + memBlock + diskBlock;
  },
};

const getStatusEmoji = (percent: number) => {
  if (percent > 90) return "🔴"; // Критично
  if (percent > 75) return "🟡"; // Увага
  return "🟢"; // Ок
};

async function getCpuTemp(): Promise<string | null> {
  try {
    // Викликаємо sensors на хості
    const output = await execOnHost("sensors");
    // Шукаємо рядок, що починається на Package id 0 або Core 0 (залежить від CPU)
    // Регулярка шукає щось на кшталт "+55.0°C"
    const match = output.match(/(?:Package id 0|Core 0|temp1):\s+\+([\d.]+)/);

    if (match && match[1]) {
      return match[1];
    }

    return null;
  } catch (e) {
    console.error("Temp error:", e);
    return null;
  }
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [d && `${d}д`, h && `${h}г`, m && `${m}хв`].filter(Boolean).join(" ");
}
