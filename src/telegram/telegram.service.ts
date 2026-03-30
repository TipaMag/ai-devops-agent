import axios from "axios";
import { config } from "../config";

export async function sendMessage(chatId: number, text: string) {
  await axios.post(
    `https://api.telegram.org/bot${config.telegramToken}/sendMessage`,
    {
      chat_id: chatId,
      text,
    }
  );
}