/**
 * Notificaciones por Telegram (API HTTP pura, sin dependencias).
 * Config por env: TELEGRAM_BOT_TOKEN (de @BotFather) + TELEGRAM_CHAT_ID.
 * Si faltan, las alertas quedan deshabilitadas silenciosamente (la app funciona igual).
 */
export function telegramEnabled(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    if (!res.ok) {
      console.error("[telegram] fallo:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[telegram] error:", (err as Error).message);
    return false;
  }
}
