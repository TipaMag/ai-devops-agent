import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
import { execOnHost } from "./host.service";

export async function getNetworkInfo(): Promise<string> {
  try {
    const [
      ipBrief,
      route,
      publicIp,
      tailscaleIp,
      resolv,
      pingIp,
      pingDns,
    ] = await Promise.all([
      execOnHost("ip -brief addr"),
      execOnHost("ip route"),
      execOnHost("curl -s ifconfig.me"),
      execOnHost("tailscale ip -4 || true"),
      execOnHost("cat /etc/resolv.conf"),
      execOnHost("ping -c 1 8.8.8.8 || true"),
      execOnHost("ping -c 1 google.com || true"),
    ]);

    // --- LAN ---
    const lanMatch = ipBrief.match(/enp\S+\s+UP\s+(\d+\.\d+\.\d+\.\d+)/);
    const lanIp = lanMatch?.[1];

    // --- Gateway ---
    const gwMatch = route.match(/default via (\d+\.\d+\.\d+\.\d+)/);
    const gateway = gwMatch?.[1];

    // --- DNS ---
    const dns = [...resolv.matchAll(/nameserver (\d+\.\d+\.\d+\.\d+)/g)]
      .map(m => m[1]);

    // --- Health ---
    const internetOk = pingIp.includes("1 received");
    const dnsOk = pingDns.includes("1 received");

    return (
      `🌐 *Мережа*\n\n` +

      `🌍 *Публічний IP:* \`${publicIp.trim()}\`\n` +
      (tailscaleIp ? `🔐 *Tailscale:* \`${tailscaleIp.trim()}\`\n\n` : "\n") +

      `🏠 *Локальна мережа:*\n` +
      (lanIp ? `IP: \`${lanIp}\`\n` : "") +
      (gateway ? `Gateway: \`${gateway}\`\n\n` : "\n") +

      `🧠 *DNS:*\n` +
      dns.map(d => `• \`${d}\``).join("\n") +

      `\n\n🧪 *Стан:*\n` +
      `🌐 Інтернет: ${internetOk ? "✅" : "❌"}\n` +
      `🧠 DNS: ${dnsOk ? "✅" : "❌"}`
    );

  } catch (e: any) {
    return `❌ Помилка мережі: ${e.message}`;
  }
}

export async function runSpeedtest(): Promise<string> {
  try {
    const { stdout } = await execAsync("speedtest --format=json --accept-license --accept-gdpr");

    const data = JSON.parse(stdout);

    const dl = (data.download.bandwidth * 8 / 1_000_000).toFixed(1);
    const ul = (data.upload.bandwidth * 8 / 1_000_000).toFixed(1);
    const ping = data.ping.latency.toFixed(1);

    return (
      `📶 *Speedtest*\n\n` +
      `*ISP:* ${data.isp}\n` +
      `*Сервер:* ${data.server.name}\n\n` +
      `⬇️ Download: *${dl} Mbps*\n` +
      `⬆️ Upload: *${ul} Mbps*\n` +
      `📡 Ping: *${ping} ms*`
    );
  } catch (err: any) {
    return `❌ Помилка speedtest: ${err.message}`;
  }
}