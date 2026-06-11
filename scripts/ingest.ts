/** Snapshot en vivo + rollup del día, para TODOS los usuarios. Uso: npm run ingest (o cron cada 5 min) */
import "dotenv/config";
import { createDataSource } from "../src/server/db/data-source";
import { ingestAllUsers } from "../src/server/auth/ingest-users";

async function main() {
  const ds = await createDataSource().initialize();
  const results = await ingestAllUsers(ds);
  for (const r of results) {
    if (r.error) console.error(`✗ ${r.userName}: ${r.error}`);
    else console.log(`✓ ${r.userName}: ${r.snapshots} snapshot(s)`);
  }
  await ds.destroy();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
