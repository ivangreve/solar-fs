/**
 * Recalcula los rollups diarios (daily_stats) de TODA la telemetría ya guardada,
 * usando los buckets de día en hora LOCAL del equipo (APP_TZ). NO pega a Felicity.
 * Uso: npm run reroll  — correr una vez tras cambiar la zona horaria.
 */
import "dotenv/config";
import { createDataSource } from "../src/server/db/data-source";
import { rollupDay } from "../src/server/ingest/ingest";
import { APP_TZ } from "../src/server/time";
import { Device } from "../src/server/db/entities/Device";

async function main() {
  const ds = await createDataSource().initialize();
  const devices = await ds.getRepository(Device).find();
  for (const dev of devices) {
    const days: { day: string }[] = await ds.query(
      `SELECT DISTINCT to_char(ts AT TIME ZONE $2, 'YYYY-MM-DD') AS day
       FROM telemetry WHERE device_sn = $1 ORDER BY day`,
      [dev.deviceSn, APP_TZ],
    );
    for (const { day } of days) await rollupDay(ds, dev.deviceSn, day);
    console.log(`✓ ${dev.deviceSn}: ${days.length} día(s) recalculados (${APP_TZ})`);
  }
  await ds.destroy();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
