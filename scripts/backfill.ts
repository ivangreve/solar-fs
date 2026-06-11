/**
 * Backfill del histórico completo (5-min) desde la instalación + rollups, por usuario.
 * Uso: npm run backfill            (todos los dispositivos de todos los usuarios)
 *      npm run backfill 2026-05-01 (desde una fecha)
 */
import "dotenv/config";
import { createDataSource } from "../src/server/db/data-source";
import { backfillDevice, rollupDay } from "../src/server/ingest/ingest";
import { Plant } from "../src/server/db/entities/Plant";
import { User } from "../src/server/db/entities/User";
import { clientForUser, devicesForUser } from "../src/server/auth/ingest-users";
import { APP_TZ } from "../src/server/time";

async function main() {
  const fromArg = process.argv[2];
  const ds = await createDataSource().initialize();
  const users = await ds.getRepository(User).find();
  if (!users.length) {
    console.log("No hay usuarios. Que alguien se loguee primero (o corré sync:meta tras el login).");
    await ds.destroy();
    return;
  }

  for (const user of users) {
    const api = clientForUser(user);
    const devices = await devicesForUser(ds, user.id);
    if (!devices.length) {
      console.log(`(${user.felicityUserName}) sin dispositivos. Corré primero: npm run sync:meta`);
      continue;
    }

    for (const dev of devices) {
      const plant = await ds.getRepository(Plant).findOneBy({ id: dev.plantId });
      const from = fromArg ?? plant?.installDate ?? "2026-01-01";
      console.log(`↓ [${user.felicityUserName}] Backfill ${dev.deviceSn} desde ${from}...`);
      const n = await backfillDevice(ds, api, dev, from);
      console.log(`  ${n} filas. Calculando rollups diarios...`);

      const days: { day: string }[] = await ds.query(
        `SELECT DISTINCT to_char(ts AT TIME ZONE $2, 'YYYY-MM-DD') AS day
         FROM telemetry WHERE device_sn = $1 ORDER BY day`,
        [dev.deviceSn, APP_TZ],
      );
      for (const { day } of days) await rollupDay(ds, dev.deviceSn, day);
      console.log(`  ✓ ${days.length} día(s) con rollup`);
    }
  }
  await ds.destroy();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
