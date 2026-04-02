import { Telegraf } from "telegraf";
import { config } from './config';
import { getSession, saveSession } from "./services/session/session.service";
import { routeMessage } from './router/messageRouter';
import { mainKeyboard } from "./telegram/keyboards";
import { isMenuButton, handleMenuButton } from "./telegram/menuRouter";

export const bot = new Telegraf(config.telegramToken);


function isAllowed(chatId: number): boolean {
  return config.allowedUserIds.includes(chatId.toString());
}

// ── bot.start ────────────────────────────────────────────────────────────
bot.start(async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId || !isAllowed(chatId)) {
    await ctx.reply("⛔ Access denied");
    return;
  }

  await ctx.reply(
    "👋 Привіт! Я твій сервер-агент.\n\nПиши текст — відповім через AI.\nКнопки нижче — швидкі команди.",
    {
      parse_mode: "Markdown",
      ...mainKeyboard()
    }
  );
});

// ── Всі текстові повідомлення ─────────────────────────────────────────────
bot.on("text", async (ctx) => {
  const chatId = ctx.chat?.id;
  const text = ctx.message.text;

  if (!chatId || !isAllowed(chatId)) {
    await ctx.reply("⛔ Access denied");
    return;
  }

  if (text === "/menu") {
    await ctx.reply("🏠 Головне меню", mainKeyboard());
    return;
  }

  // Обробка кнопок меню (Reply Keyboard)
  // Важливо: перевіряємо кнопки ПЕРЕД відправкою в AI
  if (isMenuButton(text)) {
    try {
      // await ctx.deleteMessage();
    } catch (e) {
      // Іноді не можна видалити, якщо бот не адмін (але в особистих має працювати)
    }

    await handleMenuButton(ctx, text);
    return;
  }

  try {
    await ctx.sendChatAction('typing');

    const session = await getSession(chatId);
    const { text: responseText, session: updatedSession } = await routeMessage(text, session);

    await saveSession(chatId, updatedSession);

    await ctx.reply(responseText, { parse_mode: "Markdown" }); 
  } catch (err) {
    console.error("Agent error:", err);
    await ctx.reply("❌ Помилка AI. Спробуй ще раз.");
  }
});

// ─────────────────────────────────────────────────────────────────────────
console.log("🚀 Starting Telegram bot...");

bot.launch({ dropPendingUpdates: true }).catch((err) => {
  console.error("Failed to launch bot:", err);
  process.exit(1);
});

bot.catch((err, ctx) => {
  console.error("GLOBAL BOT ERROR:", err);

  ctx.reply("❌ Внутрішня помилка бота");
});

// Плавна зупинка — важливо для ts-node-dev рестарту
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
