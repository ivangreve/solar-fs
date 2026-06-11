/** Sincroniza plantas y dispositivos desde Felicity, para TODOS los usuarios. Uso: npm run sync:meta */
import "dotenv/config";
import { createDataSource } from "../src/server/db/data-source";
import { syncAllUsers } from "../src/server/auth/ingest-users";

async function main() {
  const ds = await createDataSource().initialize();
  const results = await syncAllUsers(ds);
  for (const r of results) {
    if (r.error) console.error(`✗ ${r.userName}: ${r.error}`);
    else console.log(`✓ ${r.userName}: ${r.snapshots} dispositivo(s)`);
  }
  await ds.destroy();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
