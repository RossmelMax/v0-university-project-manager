import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.delete";
import dns from "dns/promises";

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

function parseConnectionString(conn?: string) {
  if (!conn) return null;
  try {
    return new URL(conn);
  } catch (e) {
    return null;
  }
}

const url = parseConnectionString(connectionString ?? undefined);

async function createPool() {
  if (!url) {
    return new Pool({ connectionString });
  }

  const hostname = url.hostname;
  try {
    // Try to prefer IPv4 resolution to avoid environments with broken IPv6 routing.
    const res = await dns.lookup(hostname, { family: 4 });
    const ip = res.address;
    const user = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password || "");
    const database = url.pathname ? url.pathname.replace(/^\//, "") : undefined;
    const port = Number(url.port || 5432);

    // Use IP as `host` but preserve TLS hostname verification by setting
    // `ssl.servername` to the original hostname.
    return new Pool({
      host: ip,
      port,
      user: user || undefined,
      password: password || undefined,
      database: database || undefined,
      ssl: { rejectUnauthorized: true, servername: hostname },
    } as any);
  } catch (err) {
    // If IPv4 lookup fails, fall back to using the original connection string.
    // This keeps previous behavior.
    // eslint-disable-next-line no-console
    console.warn(
      "IPv4 lookup for DB host failed or not available, falling back to connectionString:",
      err,
    );
    return new Pool({ connectionString });
  }
}

export const poolPromise = createPool();
export const pool = (await poolPromise) as Pool;
export const db = drizzle(pool, { schema });
