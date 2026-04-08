import si from "systeminformation";
import { execOnHost } from "./host.service";


const EXTERNAL_DISK = "sdb";

const PARTITIONS: Record<string, string> = {
  sdb2: "/mnt/storage",
  sdb3: "/mnt/timemachine",
};

export type DiskStatus = "disconnected" | "unmounted" | "mounted";

export interface DiskState {
  status: DiskStatus;
  model?: string;
  totalSize?: string;
  partitions?: PartitionInfo[];
}

export interface PartitionInfo {
  name: string;
  mountPoint: string;
  mounted: boolean;
  size?: string;
  used?: string;
  available?: string;
  usePercent?: number;
}

function toGb(bytes: number): string {
  return (bytes / 1024 ** 3).toFixed(0);
}

export function progressBar(percent: number): string {
  const filled = Math.round(percent / 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

export async function getDiskState(): Promise<DiskState> {
  const [blockDevices, fsSizes] = await Promise.all([
    si.blockDevices(),
    si.fsSize(),
  ]);

  const disk = blockDevices.find(
    (d) => d.name === EXTERNAL_DISK && d.type === "disk",
  );

  if (!disk) {
    return { status: "disconnected" };
  }

  const mountedFs = new Map(
    fsSizes
      .filter((f) => f.fs.startsWith("/dev/sdb"))
      .map((f) => [f.fs.replace("/dev/", ""), f]),
  );

  const partitions: PartitionInfo[] = Object.entries(PARTITIONS).map(
    ([name, mountPoint]) => {
      const fs = mountedFs.get(name);
      return {
        name,
        mountPoint,
        mounted: !!fs,
        size: fs ? toGb(fs.size) + " GB" : undefined,
        used: fs ? toGb(fs.used) + " GB" : undefined,
        available: fs ? toGb(fs.available) + " GB" : undefined,
        usePercent: fs ? Math.round(fs.use) : undefined,
      };
    },
  );

  return {
    status: partitions.some((p) => p.mounted) ? "mounted" : "unmounted",
    model: disk.model ?? "External HDD",
    totalSize: toGb(disk.size) + " GB",
    partitions,
  };
}

export async function getDiskStatusText(): Promise<string> {
  const state = await getDiskState();

  if (state.status === "disconnected") {
    return "🔴 *Зовнішній диск не підключено*";
  }

  const lines: string[] = [`💾 *${state.model}* (${state.totalSize})`, ""];

  if (state.status === "unmounted") {
    lines.push("🟡 Диск підключено, але не змонтовано");
    return lines.join("\n");
  }

  for (const p of state.partitions!) {
    if (p.mounted) {
      lines.push(
        `🟢 *${p.name}* → \`${p.mountPoint}\``,
        `${progressBar(p.usePercent!)} ${p.usePercent}%`,
        `${p.used} / ${p.size} (вільно: ${p.available})`,
        "",
      );
    } else {
      lines.push(`🟡 *${p.name}* → не змонтовано`, "");
    }
  }

  return lines.join("\n").trim();
}

// Монтуємо всі розділи одразу
export async function mountDisk(): Promise<string> {
  const state = await getDiskState();

  if (state.status === "disconnected") {
    return "❌ Диск не підключено до сервера";
  }
  if (state.status === "mounted") {
    return "⚠️ Диск вже змонтовано";
  }

  const errors: string[] = [];

  for (const [name, mountPoint] of Object.entries(PARTITIONS)) {
    try {
      await execOnHost(`mount /dev/${name} ${mountPoint}`);
    } catch (err: any) {
      errors.push(`${name}: ${err.message}`);
    }
  }

  if (errors.length > 0) {
    return `⚠️ Частково змонтовано, помилки:\n${errors.join("\n")}`;
  }

  return "✅ Диск змонтовано";
}

// Розмонтуємо всі розділи одразу
export async function umountDisk(): Promise<string> {
  const state = await getDiskState();

  if (state.status === "disconnected") {
    return "❌ Диск не підключено до сервера";
  }
  if (state.status === "unmounted") {
    return "⚠️ Диск вже розмонтовано";
  }

  const errors: string[] = [];

  for (const mountPoint of Object.values(PARTITIONS)) {
    try {
      // Додаємо прапорець -l (lazy), щоб розмонтувати, навіть якщо диск зайнятий
      await execOnHost(`umount -l ${mountPoint}`);
    } catch (err: any) {
      errors.push(`${mountPoint}: ${err.message}`);
    }
  }

  if (errors.length > 0) {
    // Якщо помилка "not mounted" — це фактично успіх для нас
    const realErrors = errors.filter(e => !e.includes("not mounted"));
    if (realErrors.length === 0) return "✅ Диск розмонтовано.";

    return `⚠️ Помилки при розмонтуванні:\n${errors.join("\n")}`;
  }

  return "✅ Диск розмонтовано. Тепер можна безпечно відключити.";
}
