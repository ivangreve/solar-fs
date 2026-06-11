/**
 * Crea/actualiza el schema desde las entities (DEV ONLY).
 * Uso: npm run db:sync
 * En producción se reemplaza por migraciones de TypeORM.
 */
import "dotenv/config";
import { createDataSource } from "../src/server/db/data-source";

async function main() {
  const ds = createDataSource({ synchronize: true });
  await ds.initialize();
  console.log("✓ Schema sincronizado");
  await ds.destroy();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
