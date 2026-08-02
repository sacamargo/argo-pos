import Database from "@tauri-apps/plugin-sql";
import { drizzle, type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { DATABASE_URL } from "@/database/constants";
import * as schema from "@/database/schema";

export type AppDatabase = SqliteRemoteDatabase<typeof schema>;

let sqliteConnection: Database | null = null;
let drizzleDb: AppDatabase | null = null;

function isSelectQuery(sql: string): boolean {
  const normalized = sql.trim().toLowerCase();
  return (
    normalized.startsWith("select") ||
    normalized.startsWith("pragma") ||
    normalized.startsWith("with")
  );
}

async function getSqliteConnection(): Promise<Database> {
  if (!sqliteConnection) {
    sqliteConnection = await Database.load(DATABASE_URL);
  }
  return sqliteConnection;
}

function createDrizzleClient(): AppDatabase {
  return drizzle(
    async (sql, params, method) => {
      const sqlite = await getSqliteConnection();

      if (isSelectQuery(sql)) {
        const rows = (await sqlite.select(sql, params)) as Record<string, unknown>[];
        const values = rows.map((row) => Object.values(row));

        if (method === "get") {
          return { rows: values[0] ?? [] };
        }

        return { rows: values };
      }

      await sqlite.execute(sql, params);
      return { rows: [] };
    },
    { schema },
  );
}

export async function getDatabase(): Promise<AppDatabase> {
  if (!drizzleDb) {
    await getSqliteConnection();
    drizzleDb = createDrizzleClient();
  }
  return drizzleDb;
}

/** Closes the SQLite pool so the DB file can be replaced (restore). */
export async function closeDatabase(): Promise<void> {
  if (sqliteConnection) {
    await sqliteConnection.close();
  }
  sqliteConnection = null;
  drizzleDb = null;
}

/** Runs work inside a SQLite transaction on the shared connection. */
export async function withTransaction<T>(
  work: (db: AppDatabase) => Promise<T>,
): Promise<T> {
  /**
   * IMPORTANT: `@tauri-apps/plugin-sql` uses a sqlx connection pool.
   * Separate `execute("BEGIN")` / `COMMIT` / `ROLLBACK` calls land on
   * *different* pooled connections, so they do not form a real transaction
   * and can leave a write lock open (SQLITE_BUSY / "database is locked").
   * See tauri-apps/plugins-workspace#886.
   *
   * Until the plugin exposes real transactions (or SQLite max_connections=1),
   * run statements sequentially without BEGIN/COMMIT wrappers.
   */
  const db = await getDatabase();
  return work(db);
}

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
