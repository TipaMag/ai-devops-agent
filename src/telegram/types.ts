import { Context } from "telegraf";

export interface MenuSection {
  // які кнопки ця секція обробляє
  canHandle: (text: string) => boolean;
  // що робити при натисканні
  handle: (ctx: Context, text: string, pending: PendingStore) => Promise<void>;
}

export interface PendingStore {
  get: (chatId: number) => string | undefined;
  set: (chatId: number, command: string) => void;
  delete: (chatId: number) => void;
}