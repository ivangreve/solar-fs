import { NextResponse } from "next/server";
import { getDataSource } from "@/server/db/data-source";
import { sendTelegram } from "@/server/alerts/telegram";
import { buildEstado, buildResumen, HELP_TEXT } from "@/server/alerts/bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook de Telegram (comandos del bot: /estado, /resumen).
 * Seguridad en dos capas: el header secreto de setWebhook (X-Telegram-Bot-Api-Secret-Token)
 * y el chat_id del dueño (TELEGRAM_CHAT_ID) — cualquier otro chat se ignora.
 * Siempre devuelve 200 ante updates válidos: Telegram reintenta los no-200.
 */
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: { message?: { chat?: { id?: number }; text?: string } };
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const chatId = update.message?.chat?.id;
  const text = update.message?.text?.trim() ?? "";
  if (!chatId || String(chatId) !== process.env.TELEGRAM_CHAT_ID || !text.startsWith("/")) {
    return NextResponse.json({ ok: true });
  }

  const cmd = text.split(/[\s@]/, 1)[0].toLowerCase();
  try {
    const ds = await getDataSource();
    const reply =
      cmd === "/estado" ? await buildEstado(ds)
      : cmd === "/resumen" ? await buildResumen(ds)
      : HELP_TEXT;
    await sendTelegram(reply);
  } catch (err) {
    console.error("[telegram-webhook]", (err as Error).message);
    await sendTelegram("⚠️ No pude leer los datos recién. Probá de nuevo en un toque.");
  }
  return NextResponse.json({ ok: true });
}
