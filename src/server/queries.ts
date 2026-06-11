import { getDataSource } from "./db/data-source";
import { Plant } from "./db/entities/Plant";
import { APP_TZ, localToday } from "./time";

export interface PlantOverview {
  plant: Plant;
  // En vivo (suma del último dato de cada dispositivo)
  pvNowW: number;
  loadNowW: number;
  socAvg: number | null;
  lastTs: string | null;
  // Hoy (agregado)
  ePvKwh: number;
  eLoadKwh: number;
  eGridInKwh: number;
  eGridFeedKwh: number;
  savings: number;
  selfSufficiencyPct: number | null;
  selfConsumptionPct: number | null;
}

const pct = (num: number, den: number) =>
  den > 0 ? Math.round(Math.max(0, Math.min(1, num / den)) * 1000) / 10 : null;

// ── Helpers de autorización (fail-closed: si no es dueño, no hay datos) ──
async function plantOwned(ds: Awaited<ReturnType<typeof getDataSource>>, plantId: string, ownerUserId: string): Promise<boolean> {
  const [r] = await ds.query(`SELECT 1 FROM plants WHERE id = $1 AND owner_user_id = $2`, [plantId, ownerUserId]);
  return Boolean(r);
}
async function deviceOwned(ds: Awaited<ReturnType<typeof getDataSource>>, deviceSn: string, ownerUserId: string): Promise<boolean> {
  const [r] = await ds.query(
    `SELECT 1 FROM devices d JOIN plants p ON p.id = d.plant_id WHERE d.device_sn = $1 AND p.owner_user_id = $2`,
    [deviceSn, ownerUserId],
  );
  return Boolean(r);
}

export async function getPlants(ownerUserId: string): Promise<Plant[]> {
  const ds = await getDataSource();
  return ds.getRepository(Plant).find({ where: { ownerUserId }, order: { name: "ASC" } });
}

export async function getPlantOverview(plantId: string, ownerUserId: string): Promise<PlantOverview | null> {
  const ds = await getDataSource();
  const plant = await ds.getRepository(Plant).findOneBy({ id: plantId, ownerUserId });
  if (!plant) return null;
  const today = localToday();

  // Último dato en vivo por dispositivo (DISTINCT ON)
  const live: Array<{ pv: number; load: number; soc: number | null; ts: string }> = await ds.query(
    `SELECT DISTINCT ON (t.device_sn)
        COALESCE(t.pv_power_w,0) AS pv, COALESCE(t.load_power_w,0) AS load,
        t.soc_pct AS soc, t.ts
     FROM telemetry t JOIN devices d ON d.device_sn = t.device_sn
     WHERE d.plant_id = $1
     ORDER BY t.device_sn, t.ts DESC`,
    [plantId],
  );

  // Totales de hoy (suma de los rollups de cada dispositivo)
  const [agg]: Array<Record<string, number>> = await ds.query(
    `SELECT COALESCE(SUM(e_pv_kwh),0) e_pv, COALESCE(SUM(e_load_kwh),0) e_load,
            COALESCE(SUM(e_grid_in_kwh),0) e_gin, COALESCE(SUM(e_grid_feed_kwh),0) e_gfeed,
            COALESCE(SUM(savings),0) savings
     FROM daily_stats ds JOIN devices d ON d.device_sn = ds.device_sn
     WHERE d.plant_id = $1 AND ds.day = $2`,
    [plantId, today],
  );

  const socs = live.map((r) => r.soc).filter((s): s is number => s != null);
  return {
    plant,
    pvNowW: live.reduce((s, r) => s + Number(r.pv), 0),
    loadNowW: live.reduce((s, r) => s + Number(r.load), 0),
    socAvg: socs.length ? Math.round(socs.reduce((a, b) => a + b, 0) / socs.length) : null,
    lastTs: live.length ? live.map((r) => r.ts).sort().at(-1)! : null,
    ePvKwh: Number(agg.e_pv),
    eLoadKwh: Number(agg.e_load),
    eGridInKwh: Number(agg.e_gin),
    eGridFeedKwh: Number(agg.e_gfeed),
    savings: Number(agg.savings),
    selfSufficiencyPct: pct(Number(agg.e_load) - Number(agg.e_gin), Number(agg.e_load)),
    selfConsumptionPct: pct(Number(agg.e_pv) - Number(agg.e_gfeed), Number(agg.e_pv)),
  };
}

export interface PlantSeries {
  daily: Array<{ day: string; ePv: number; eGen: number; eLoad: number; selfCons: number | null }>;
  intraday: Array<{ t: string; pv: number; load: number; gen: number; soc: number | null }>;
}

export async function getPlantSeries(plantId: string, ownerUserId: string): Promise<PlantSeries> {
  const ds = await getDataSource();
  if (!(await plantOwned(ds, plantId, ownerUserId))) return { daily: [], intraday: [] };
  const today = localToday();

  const daily: PlantSeries["daily"] = (
    await ds.query(
      `SELECT ds.day::text AS day,
              COALESCE(SUM(e_pv_kwh),0) e_pv,
              COALESCE(SUM(e_gen_kwh),0) e_gen,
              COALESCE(SUM(e_load_kwh),0) e_load,
              COALESCE(SUM(e_pv_kwh),0) - COALESCE(SUM(e_grid_feed_kwh),0) self_cons_kwh
       FROM daily_stats ds JOIN devices d ON d.device_sn = ds.device_sn
       WHERE d.plant_id = $1
       GROUP BY ds.day ORDER BY ds.day DESC LIMIT 30`,
      [plantId],
    )
  )
    .reverse()
    .map((r: Record<string, string>) => ({
      day: r.day,
      ePv: Number(r.e_pv),
      eGen: Number(r.e_gen),
      eLoad: Number(r.e_load),
      selfCons: Number(r.e_pv) > 0 ? Math.round((Number(r.self_cons_kwh) / Number(r.e_pv)) * 1000) / 10 : null,
    }));

  // Intradía del dispositivo con más datos hoy (el inversor principal)
  const [main]: Array<{ device_sn: string }> = await ds.query(
    `SELECT t.device_sn FROM telemetry t JOIN devices d ON d.device_sn = t.device_sn
     WHERE d.plant_id = $1 AND (t.ts AT TIME ZONE $3) >= $2
     GROUP BY t.device_sn, d.role
     ORDER BY (d.role = 'inverter') DESC, COUNT(*) DESC LIMIT 1`,
    [plantId, `${today} 00:00:00`, APP_TZ],
  );

  const intraday: PlantSeries["intraday"] = main
    ? (
        await ds.query(
          `SELECT to_char(ts AT TIME ZONE $3, 'HH24:MI') t, pv_power_w pv, load_power_w load, gen_power_w gen, soc_pct soc
           FROM telemetry WHERE device_sn = $1 AND (ts AT TIME ZONE $3) >= $2 ORDER BY ts ASC`,
          [main.device_sn, `${today} 00:00:00`, APP_TZ],
        )
      ).map((r: Record<string, string | null>) => ({
        t: r.t as string,
        pv: Number(r.pv ?? 0),
        load: Number(r.load ?? 0),
        gen: Number(r.gen ?? 0),
        soc: r.soc != null ? Number(r.soc) : null,
      }))
    : [];

  return { daily, intraday };
}

// ── Campos canónicos de telemetry (snake_case → camelCase) para latest/detalle ──
const TELEMETRY_FIELDS: Record<string, string> = {
  pv_power_w: "pvPowerW",
  pv1_power_w: "pv1PowerW",
  pv2_power_w: "pv2PowerW",
  pv3_power_w: "pv3PowerW",
  pv4_power_w: "pv4PowerW",
  load_power_w: "loadPowerW",
  grid_in_power_w: "gridInPowerW",
  feed_power_w: "feedPowerW",
  batt_charge_w: "battChargeW",
  batt_discharge_w: "battDischargeW",
  soc_pct: "socPct",
  batt_volt: "battVolt",
  batt_curr: "battCurr",
  ac_out_power_w: "acOutPowerW",
  ac_out_volt: "acOutVolt",
  ac_out_freq: "acOutFreq",
  temp_max: "tempMax",
  mos_temp: "mosTemp",
  pv_temp: "pvTemp",
  e_today_kwh: "eTodayKwh",
  e_pv_today_kwh: "ePvTodayKwh",
  e_load_today_kwh: "eLoadTodayKwh",
  e_grid_in_today_kwh: "eGridInTodayKwh",
  e_grid_feed_today_kwh: "eGridFeedTodayKwh",
  e_bat_char_today_kwh: "eBatCharTodayKwh",
  e_bat_dischar_today_kwh: "eBatDisCharTodayKwh",
  gen_power_w: "genPowerW",
  gen_today_kwh: "genTodayKwh",
  gen_total_kwh: "genTotalKwh",
};

const DAILY_FIELDS: Record<string, string> = {
  e_pv_kwh: "ePvKwh",
  e_load_kwh: "eLoadKwh",
  e_grid_in_kwh: "eGridInKwh",
  e_grid_feed_kwh: "eGridFeedKwh",
  e_bat_char_kwh: "eBatCharKwh",
  e_bat_dischar_kwh: "eBatDisCharKwh",
  e_gen_kwh: "eGenKwh",
  self_sufficiency_pct: "selfSufficiencyPct",
  self_consumption_pct: "selfConsumptionPct",
  savings: "savings",
  feed_income: "feedIncome",
  peak_pv_w: "peakPvW",
  min_soc: "minSoc",
  max_soc: "maxSoc",
};

/** Convierte una fila de DB (snake_case) en Record canónico (camelCase, números o null). */
function toCanonRecord(
  row: Record<string, unknown> | undefined,
  fields: Record<string, string>,
): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const [col, key] of Object.entries(fields)) {
    const v = row?.[col];
    out[key] = v == null ? null : Number(v);
  }
  return out;
}

/** Clasifica el estado según antigüedad del último dato (minutos). */
function statusFromTs(lastTs: string | null): "online" | "stale" | "offline" {
  if (!lastTs) return "offline";
  const mins = (Date.now() - new Date(lastTs).getTime()) / 60000;
  if (mins < 15) return "online";
  if (mins < 60) return "stale";
  return "offline";
}

export async function getDevicesWithRole(plantId: string, ownerUserId: string): Promise<
  Array<{
    deviceSn: string;
    model: string | null;
    role: string;
    lastTs: string | null;
    pvNowW: number;
    socPct: number | null;
    status: "online" | "stale" | "offline";
  }>
> {
  const ds = await getDataSource();
  if (!(await plantOwned(ds, plantId, ownerUserId))) return [];
  const rows: Array<{
    device_sn: string;
    model: string | null;
    role: string;
    last_ts: string | null;
    pv_now: number | null;
    soc: number | null;
  }> = await ds.query(
    `SELECT d.device_sn, d.model, d.role, t.last_ts, t.pv_now, t.soc
     FROM devices d
     LEFT JOIN LATERAL (
       SELECT t.ts::text AS last_ts, COALESCE(t.pv_power_w,0) AS pv_now, t.soc_pct AS soc
       FROM telemetry t WHERE t.device_sn = d.device_sn ORDER BY t.ts DESC LIMIT 1
     ) t ON true
     WHERE d.plant_id = $1
     ORDER BY d.role, d.device_sn`,
    [plantId],
  );
  return rows.map((r) => ({
    deviceSn: r.device_sn,
    model: r.model,
    role: r.role,
    lastTs: r.last_ts,
    pvNowW: Number(r.pv_now ?? 0),
    socPct: r.soc != null ? Number(r.soc) : null,
    status: statusFromTs(r.last_ts),
  }));
}

export async function getDeviceDetail(deviceSn: string, ownerUserId: string): Promise<{
  device: { deviceSn: string; model: string | null; role: string; plantId: string };
  latest: Record<string, number | null>;
  today: Record<string, number | null>;
} | null> {
  const ds = await getDataSource();
  // Ownership por join: un usuario no puede leer un deviceSn ajeno (cierra IDOR).
  const [dev]: Array<{ device_sn: string; model: string | null; role: string; plant_id: string }> =
    await ds.query(
      `SELECT d.device_sn, d.model, d.role, d.plant_id
       FROM devices d JOIN plants p ON p.id = d.plant_id
       WHERE d.device_sn = $1 AND p.owner_user_id = $2`,
      [deviceSn, ownerUserId],
    );
  if (!dev) return null;
  const today = localToday();

  const [latestRow]: Array<Record<string, unknown>> = await ds.query(
    `SELECT * FROM telemetry WHERE device_sn = $1 ORDER BY ts DESC LIMIT 1`,
    [deviceSn],
  );
  const [todayRow]: Array<Record<string, unknown>> = await ds.query(
    `SELECT * FROM daily_stats WHERE device_sn = $1 AND day = $2`,
    [deviceSn, today],
  );

  return {
    device: { deviceSn: dev.device_sn, model: dev.model, role: dev.role, plantId: dev.plant_id },
    latest: toCanonRecord(latestRow, TELEMETRY_FIELDS),
    today: toCanonRecord(todayRow, DAILY_FIELDS),
  };
}

export async function getDeviceSeries(deviceSn: string, ownerUserId: string): Promise<{
  intraday: Array<{ t: string; pv: number; load: number; soc: number | null; gen: number }>;
  daily: Array<{ day: string; ePv: number; eLoad: number; eGen: number }>;
}> {
  const ds = await getDataSource();
  if (!(await deviceOwned(ds, deviceSn, ownerUserId))) return { intraday: [], daily: [] };
  const today = localToday();

  const intraday: Array<{ t: string; pv: number; load: number; soc: number | null; gen: number }> =
    (
      await ds.query(
        `SELECT to_char(ts AT TIME ZONE $3, 'HH24:MI') t, pv_power_w pv, load_power_w load, soc_pct soc, gen_power_w gen
         FROM telemetry WHERE device_sn = $1 AND (ts AT TIME ZONE $3) >= $2 ORDER BY ts ASC`,
        [deviceSn, `${today} 00:00:00`, APP_TZ],
      )
    ).map((r: Record<string, string | null>) => ({
      t: r.t as string,
      pv: Number(r.pv ?? 0),
      load: Number(r.load ?? 0),
      soc: r.soc != null ? Number(r.soc) : null,
      gen: Number(r.gen ?? 0),
    }));

  const daily: Array<{ day: string; ePv: number; eLoad: number; eGen: number }> = (
    await ds.query(
      `SELECT day::text AS day, COALESCE(e_pv_kwh,0) e_pv, COALESCE(e_load_kwh,0) e_load,
              COALESCE(e_gen_kwh,0) e_gen
       FROM daily_stats WHERE device_sn = $1 ORDER BY day DESC LIMIT 30`,
      [deviceSn],
    )
  )
    .reverse()
    .map((r: Record<string, string>) => ({
      day: r.day,
      ePv: Number(r.e_pv),
      eLoad: Number(r.e_load),
      eGen: Number(r.e_gen),
    }));

  return { intraday, daily };
}

export async function getBatteryFleet(plantId: string, ownerUserId: string): Promise<
  Array<{
    deviceSn: string;
    model: string | null;
    socPct: number | null;
    sohPct: number | null;
    battVolt: number | null;
    lastTs: string | null;
  }>
> {
  const ds = await getDataSource();
  if (!(await plantOwned(ds, plantId, ownerUserId))) return [];
  const rows: Array<{
    device_sn: string;
    model: string | null;
    soc: number | null;
    volt: number | null;
    last_ts: string | null;
    soh: number | null;
  }> = await ds.query(
    `SELECT d.device_sn, d.model, t.soc, t.volt, t.last_ts, h.soh
     FROM devices d
     LEFT JOIN LATERAL (
       SELECT t.soc_pct AS soc, t.batt_volt AS volt, t.ts::text AS last_ts
       FROM telemetry t WHERE t.device_sn = d.device_sn ORDER BY t.ts DESC LIMIT 1
     ) t ON true
     LEFT JOIN LATERAL (
       SELECT h.soh_pct AS soh FROM health_snapshots h
       WHERE h.device_sn = d.device_sn AND h.soh_pct IS NOT NULL
       ORDER BY h.day DESC LIMIT 1
     ) h ON true
     WHERE d.plant_id = $1 AND d.role = 'battery'
     ORDER BY d.device_sn`,
    [plantId],
  );
  return rows.map((r) => ({
    deviceSn: r.device_sn,
    model: r.model,
    socPct: r.soc != null ? Number(r.soc) : null,
    sohPct: r.soh != null ? Number(r.soh) : null,
    battVolt: r.volt != null ? Number(r.volt) : null,
    lastTs: r.last_ts,
  }));
}

export async function getGeneratorSummary(plantId: string, ownerUserId: string): Promise<{
  totalKwh: number;
  todayKwh: number;
  last30: Array<{ day: string; kwh: number }>;
  everUsed: boolean;
}> {
  const ds = await getDataSource();
  if (!(await plantOwned(ds, plantId, ownerUserId))) return { totalKwh: 0, todayKwh: 0, last30: [], everUsed: false };
  const today = localToday();

  const last30: Array<{ day: string; kwh: number }> = (
    await ds.query(
      `SELECT ds.day::text AS day, COALESCE(SUM(ds.e_gen_kwh),0) kwh
       FROM daily_stats ds JOIN devices d ON d.device_sn = ds.device_sn
       WHERE d.plant_id = $1
       GROUP BY ds.day ORDER BY ds.day DESC LIMIT 30`,
      [plantId],
    )
  )
    .reverse()
    .map((r: Record<string, string>) => ({ day: r.day, kwh: Number(r.kwh) }));

  const [tot]: Array<{ total: number; today_kwh: number }> = await ds.query(
    `SELECT COALESCE(SUM(ds.e_gen_kwh),0) total,
            COALESCE(SUM(ds.e_gen_kwh) FILTER (WHERE ds.day = $2),0) today_kwh
     FROM daily_stats ds JOIN devices d ON d.device_sn = ds.device_sn
     WHERE d.plant_id = $1`,
    [plantId, today],
  );

  const totalKwh = Number(tot?.total ?? 0);
  return {
    totalKwh,
    todayKwh: Number(tot?.today_kwh ?? 0),
    last30,
    everUsed: totalKwh > 0,
  };
}

export async function getEnergyDaily(plantId: string, ownerUserId: string): Promise<
  Array<{
    day: string;
    ePv: number;
    eLoad: number;
    eGridIn: number;
    eGridFeed: number;
    eBatChar: number;
    eBatDischar: number;
    eGen: number;
  }>
> {
  const ds = await getDataSource();
  if (!(await plantOwned(ds, plantId, ownerUserId))) return [];
  return (
    await ds.query(
      `SELECT ds.day::text AS day,
              COALESCE(SUM(ds.e_pv_kwh),0) e_pv,
              COALESCE(SUM(ds.e_load_kwh),0) e_load,
              COALESCE(SUM(ds.e_grid_in_kwh),0) e_grid_in,
              COALESCE(SUM(ds.e_grid_feed_kwh),0) e_grid_feed,
              COALESCE(SUM(ds.e_bat_char_kwh) FILTER (WHERE d.role = 'inverter'),0) e_bat_char,
              COALESCE(SUM(ds.e_bat_dischar_kwh) FILTER (WHERE d.role = 'inverter'),0) e_bat_dischar,
              COALESCE(SUM(ds.e_gen_kwh),0) e_gen
       FROM daily_stats ds JOIN devices d ON d.device_sn = ds.device_sn
       WHERE d.plant_id = $1
       GROUP BY ds.day ORDER BY ds.day DESC LIMIT 30`,
      [plantId],
    )
  )
    .reverse()
    .map((r: Record<string, string>) => ({
      day: r.day,
      ePv: Number(r.e_pv),
      eLoad: Number(r.e_load),
      eGridIn: Number(r.e_grid_in),
      eGridFeed: Number(r.e_grid_feed),
      eBatChar: Number(r.e_bat_char),
      eBatDischar: Number(r.e_bat_dischar),
      eGen: Number(r.e_gen),
    }));
}
