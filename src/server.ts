import TelegramBot from 'node-telegram-bot-api';
import { config } from './config';
import { getSession, saveSession } from './session/session.service';
import { handleAgentMessage } from "./agent/agent";

const bot = new TelegramBot(config.telegramToken, { polling: true });

bot.on('message', async (msg) => {
  try {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (!text) return;

    if (!config.allowedUserIds.includes(chatId.toString())) {
      await bot.sendMessage(chatId, 'Access denied');
      return;
    }

    // Отримуємо або створюємо сесію
    const session = await getSession(chatId);
    console.log(session)

    const { messageText, session: updatedSession } = await handleAgentMessage(session, text);

    await saveSession(chatId, updatedSession);

    await bot.sendMessage(chatId, messageText);

  } catch (err) {
    console.error('Bot error:', err);
  }
});

console.log('Telegram bot started with polling...');