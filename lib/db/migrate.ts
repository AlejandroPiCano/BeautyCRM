import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const MIGRATIONS_FOLDER = "./lib/db/migrations";

interface JournalEntry {
  idx: number;
  tag: string;
  when: number;
}

interface Journal {
  entries: JournalEntry[];
}

/**
 * Marks all migrations in the journal as already applied WITHOUT running them.
 * Used when tables already exist in the DB but Drizzle's migration history is missing.
 * This is a one-time baseline for existing databases.
 */
const baselineExistingDatabase = async (sql: postgres.Sql) => {
  console.log("⚠️  Tables already exist — baselining migration history...");

  const journalPath = join(process.cwd(), MIGRATIONS_FOLDER, "meta/_journal.json");
  if (!existsSync(journalPath)) {
    console.log("⚠️  No migration journal found — skipping baseline");
    return;
  }

  const journal: Journal = JSON.parse(readFileSync(journalPath, "utf-8"));

  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id        SERIAL PRIMARY KEY,
      hash      TEXT   NOT NULL,
      created_at BIGINT
    )
  `;

  for (const entry of journal.entries) {
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${entry.tag}, ${Date.now()})
      ON CONFLICT DO NOTHING
    `;
    console.log(`   ✓ Baselined: ${entry.tag}`);
  }

  console.log("✅ Baseline complete — existing schema and data preserved");
};

const runMigrations = async () => {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
  }

  const migrationsExist =
    existsSync(join(process.cwd(), MIGRATIONS_FOLDER, "meta/_journal.json"));

  if (!migrationsExist) {
    console.log("ℹ️  No migrations found — run 'npm run db:generate' to create them");
    process.exit(0);
  }

  console.log("🔄 Running database migrations...");
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    console.log("✅ Migrations applied successfully");
  } catch (err: unknown) {
    const pgErr = err as { code?: string; message?: string };
    if (pgErr?.code === "42P07") {
      // PostgreSQL: relation already exists — DB has tables but no migration history
      await baselineExistingDatabase(sql);
    } else {
      console.error("❌ Migration failed:", pgErr?.message ?? err);
      await sql.end();
      process.exit(1);
    }
  } finally {
    await sql.end();
  }
};

runMigrations();
