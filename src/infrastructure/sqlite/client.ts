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

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
