import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function execOnHost(cmd: string): Promise<string> {
  // -t 1: підключаємось до PID 1 (хост)
  // bash -lc: запускаємо bash як "login shell", щоб підтягнути PATH для Snap та системні змінні
  const fullCommand = `nsenter -t 1 -m -u -n -i bash -lc "${cmd.replace(/"/g, '\\"')}"`;
  
  try {
    const { stdout, stderr } = await execAsync(fullCommand);
    // Деякі утиліти (як speedtest) можуть писати частину інфи в stderr, 
    // але якщо stdout є — повертаємо його
    return stdout || stderr;
  } catch (error: any) {
    // Якщо команда впала, але встигла щось виплюнути (наприклад, помилку в JSON)
    if (error.stdout) return error.stdout;
    throw new Error(error.message);
  }
}
