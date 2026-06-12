import type { DataSource } from "typeorm";
import type { FelicityClient } from "../felicity/client";
import { toCanonicalTelemetry, toCanonicalHealth, num } from "../felicity/normalize";
import { APP_TZ } from "../time";
import { Plant } from "../db/entities/Plant";
import { Device } from "../db/entities/Device";
import { Telemetry } from "../db/entities/Telemetry";
import { DailyStat } from "../db/entities/DailyStat";
import { HealthSnapshot } from "../db/entities/HealthSnapshot";

type Raw = Record<string, unknown>;
const dayStr = (d: Date) => d.toISOString().slice(0, 10);

/** Deriva el rol del dispositivo a partir del modelo de Felicity. */
function roleFromModel(model: string | null): string {
  if (!model) return "meter";
  if (model.startsWith("IVEM")) return "inverter";
  if (model.startsWith("FLA")) return "battery";
  return "unknown";
}

/**
 * Sincroniza plantas y dispositivos de UN usuario desde Felicity → tablas de metadata.
 * Reclama cada planta para `ownerUserId` (así la autorización se propaga por join).
 */
export async function syncPlantsAndDevices(
  ds: DataSource,
  api: FelicityClient,
  ownerUserId: string,
): Promise<Device[]> {
  const plants = await api.listPlants();
  const plantRepo = ds.getRepository(Plant);
  const deviceRepo = ds.getRepository(Device);
  const allDevices: Device[] = [];

  for (const p of plants.list ?? []) {
    const plantId = String(p.id ?? p.plantId);
    await plantRepo.upsert(
      {
        id: plantId,
        ownerUserId,
        name: String(p.plantName ?? p.name ?? "Planta"),
        orgCode: (p.orgCode as string) ?? null,
        country: (p.countryName as string) ?? null,
        tz: (p.timeZone as string) ?? null,
        installDate: (p.installDateStr as string)?.slice(0, 10) ?? null,
        ratedPowerW: num(p.ratedPower) ?? num(p.pvTotalPower),
      },
      ["id"],
    );

    const devices = await api.listDevices(plantId, (p.orgCode as string) ?? "");
    for (const d of devices.list ?? []) {
      const model = (d.deviceModel as string) ?? null;
      const dev: Partial<Device> = {
        deviceSn: String(d.deviceSn),
        plantId,
        model,
        role: roleFromModel(model),
        deviceType: (d.deviceType as string) ?? "OG",
        ratedPowerW: num(d.ratedPower),
      };
      await deviceRepo.upsert(dev, ["deviceSn"]);
      allDevices.push(dev as Device);
    }
  }
  return allDevices;
}

/**
 * Persiste un snapshot en vivo (telemetría + salud) de los `devices` recibidos,
 * usando el cliente `api` de su dueño.
 */
export async function ingestSnapshots(
  ds: DataSource,
  api: FelicityClient,
  devices: Device[],
): Promise<number> {
  const telRepo = ds.getRepository(Telemetry);
  const healthRepo = ds.getRepository(HealthSnapshot);
  let count = 0;

  for (const dev of devices) {
    try {
      const snap = (await api.deviceSnapshot(dev.deviceSn, dev.deviceType)) as Raw;
      const ts = snapshotTs(snap);
      await telRepo.upsert(toCanonicalTelemetry(dev.deviceSn, ts, snap) as Telemetry, [
        "deviceSn",
        "ts",
      ]);
      await healthRepo.upsert(
        { ...toCanonicalHealth(dev.deviceSn, ts, snap), day: dayStr(ts) } as HealthSnapshot,
        ["deviceSn", "day"],
      );
      await ds.getRepository(Device).update(dev.deviceSn, { lastIngestedAt: ts });
      count++;
    } catch (err) {
      console.error(`[ingest] snapshot falló para ${dev.deviceSn}:`, (err as Error).message);
    }
  }
  return count;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Pide una página de histórico con pacing y reintentos. Felicity rate-limitea con
 * code 996 ("Do not refresh frequently") si se le pega sin pausa → backoff creciente.
 */
async function historyPage(
  api: FelicityClient,
  dev: Device,
  dateStr: string,
  page: number,
): ReturnType<FelicityClient["history"]> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await api.history(dev.deviceSn, dateStr, page, 300, dev.deviceType);
    } catch (err) {
      const code = (err as { code?: number }).code;
      if (code === 996 && attempt < 5) {
        const waitS = 30 * (attempt + 1);
        console.log(`  ⏳ rate limit de Felicity (996) — espero ${waitS}s y reintento...`);
        await sleep(waitS * 1000);
        continue;
      }
      throw err;
    }
  }
}

/**
 * Backfill: trae el histórico crudo (5-min) de un dispositivo, día por día.
 * `deadline` (epoch ms) lo corta limpio entre páginas: como los upserts son
 * idempotentes, una corrida posterior continúa donde quedó.
 */
export async function backfillDevice(
  ds: DataSource,
  api: FelicityClient,
  dev: Device,
  fromDay: string,
  deadline?: number,
): Promise<number> {
  const telRepo = ds.getRepository(Telemetry);
  let inserted = 0;
  const today = new Date();
  for (let d = new Date(fromDay); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = `${dayStr(d)} 23:59:00`;
    let page = 1;
    let totalPage = 1;
    do {
      if (deadline && Date.now() > deadline) return inserted;
      await sleep(500); // pacing: no castigar la API (evita el 996)
      const res = await historyPage(api, dev, dateStr, page);
      const rows = res.dataList ?? res.data ?? [];
      totalPage = res.totalPage ?? 1;
      // Dedup por ts: el histórico puede repetir marcas de tiempo, y un upsert no
      // admite dos filas con la misma PK en el mismo comando (Postgres error 21000).
      const byTs = new Map<number, Telemetry>();
      for (const r of rows) {
        const ts = parseTs((r as Raw).dataTime, (r as Raw).dataTimeStr, d);
        if (ts) byTs.set(ts.getTime(), toCanonicalTelemetry(dev.deviceSn, ts, r as Raw) as Telemetry);
      }
      const canon = [...byTs.values()];
      if (canon.length) {
        await telRepo.upsert(canon, ["deviceSn", "ts"]);
        inserted += canon.length;
      }
      page++;
    } while (page <= totalPage);
  }
  return inserted;
}

/** Calcula el rollup diario (KPIs derivados) de un dispositivo para un día. */
export async function rollupDay(ds: DataSource, deviceSn: string, day: string): Promise<void> {
  const telRepo = ds.getRepository(Telemetry);
  const rows = await telRepo
    .createQueryBuilder("t")
    .where("t.device_sn = :sn", { sn: deviceSn })
    // Buckets del día en hora LOCAL del equipo (no UTC) para no correr la energía de día.
    .andWhere("(t.ts AT TIME ZONE :tz) >= :start AND (t.ts AT TIME ZONE :tz) < :end", {
      tz: APP_TZ,
      start: `${day} 00:00:00`,
      end: `${day} 23:59:59`,
    })
    .orderBy("t.ts", "ASC")
    .getMany();
  if (!rows.length) return;

  // Integramos potencia (W) a energía (kWh) usando el delta real entre muestras,
  // capado a 15 min para que un gap no infle el total.
  const integ = { pv: 0, load: 0, gridIn: 0, feed: 0, batChar: 0, batDis: 0, gen: 0 };
  let peakPv = 0;
  let minSoc = Infinity;
  let maxSoc = -Infinity;
  for (let i = 1; i < rows.length; i++) {
    const dtH = Math.min((rows[i].ts.getTime() - rows[i - 1].ts.getTime()) / 3_600_000, 0.25);
    const p = rows[i - 1];
    integ.pv += ((p.pvPowerW ?? 0) * dtH) / 1000;
    integ.load += ((p.loadPowerW ?? 0) * dtH) / 1000;
    integ.gridIn += ((p.gridInPowerW ?? 0) * dtH) / 1000;
    integ.feed += ((p.feedPowerW ?? 0) * dtH) / 1000;
    integ.gen += ((p.genPowerW ?? 0) * dtH) / 1000;
    // Carga/descarga estimada por balance de energía (robusto en off-grid):
    // a la batería entra el excedente de las fuentes (PV + generador + red) sobre el
    // consumo; sale el déficit. Los campos batteryCharging/Discharge vienen 0.
    const netW =
      (p.pvPowerW ?? 0) + (p.genPowerW ?? 0) + (p.gridInPowerW ?? 0) -
      (p.loadPowerW ?? 0) - (p.feedPowerW ?? 0);
    integ.batChar += (Math.max(0, netW) * dtH) / 1000;
    integ.batDis += (Math.max(0, -netW) * dtH) / 1000;
  }
  for (const r of rows) {
    if (r.pvPowerW != null) peakPv = Math.max(peakPv, r.pvPowerW);
    if (r.socPct != null) {
      minSoc = Math.min(minSoc, r.socPct);
      maxSoc = Math.max(maxSoc, r.socPct);
    }
  }

  // Autosuficiencia = parte del consumo que NO vino de fuentes externas pagas
  // (generador a nafta + red). En off-grid, lo que no salió del generador.
  const selfSufficiency =
    integ.load > 0 ? clamp01((integ.load - integ.gridIn - integ.gen) / integ.load) : null;
  const selfConsumption = integ.pv > 0 ? clamp01((integ.pv - integ.feed) / integ.pv) : null;

  // Tarifas de la planta dueña del dispositivo
  const dev = await ds.getRepository(Device).findOneBy({ deviceSn });
  const plant = dev ? await ds.getRepository(Plant).findOneBy({ id: dev.plantId }) : null;
  const buy = plant?.buyTariff ?? 0;
  const feedT = plant?.feedTariff ?? 0;
  const avoidedImport = Math.max(integ.load - integ.gridIn, 0); // kWh autoconsumidos
  const savings = avoidedImport * buy;
  const feedIncome = integ.feed * feedT;

  await ds.getRepository(DailyStat).upsert(
    {
      deviceSn,
      day,
      ePvKwh: round(integ.pv),
      eLoadKwh: round(integ.load),
      eGridInKwh: round(integ.gridIn),
      eGridFeedKwh: round(integ.feed),
      eBatCharKwh: round(integ.batChar),
      eBatDisCharKwh: round(integ.batDis),
      eGenKwh: round(integ.gen),
      selfSufficiencyPct: selfSufficiency != null ? round(selfSufficiency * 100) : null,
      selfConsumptionPct: selfConsumption != null ? round(selfConsumption * 100) : null,
      savings: round(savings),
      feedIncome: round(feedIncome),
      peakPvW: peakPv || null,
      minSoc: Number.isFinite(minSoc) ? minSoc : null,
      maxSoc: Number.isFinite(maxSoc) ? maxSoc : null,
    } as DailyStat,
    ["deviceSn", "day"],
  );
}

// ── helpers ──
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
function round(x: number) {
  return Math.round(x * 1000) / 1000;
}
/**
 * Timestamp de un snapshot en vivo. OJO: el `dataTime` (epoch) que manda Felicity
 * viene MAL (desfasado varias horas). El campo confiable es `dataTimeStr` (hora local
 * del equipo) + `timeZone` (ej "UTC-03:00"). Construimos el instante correcto desde ahí
 * y solo caemos al parser viejo si faltara el string.
 */
function snapshotTs(snap: Raw): Date {
  const str = snap.dataTimeStr;
  if (typeof str === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(str)) {
    const tz = typeof snap.timeZone === "string" ? snap.timeZone.replace(/^UTC/i, "") : "";
    const offset = /^[+-]\d{2}:\d{2}$/.test(tz) ? tz : "Z";
    const d = new Date(str.replace(" ", "T") + offset);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return parseTs(snap.dataTime, snap.dataTimeStr) ?? new Date();
}

/** Parsea el timestamp de Felicity (epoch ms o "HH:mm:ss"/"YYYY-MM-DD HH:mm:ss"). */
function parseTs(epoch: unknown, str: unknown, dayHint?: Date): Date | null {
  if (typeof epoch === "number" && epoch > 1e12) return new Date(epoch);
  if (typeof str === "string") {
    if (/^\d{4}-/.test(str)) return new Date(str.replace(" ", "T"));
    if (/^\d{2}:\d{2}/.test(str) && dayHint) {
      return new Date(`${dayStr(dayHint)}T${str}`);
    }
  }
  return null;
}
