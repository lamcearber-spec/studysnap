import pg, { type PoolClient } from "pg";

const { Pool } = pg;

export type SubscriptionTier = "starter" | "premium";

export type UsageQuota = {
  used: number;
  limit: number;
  resetAt: string;
  tier: SubscriptionTier;
};

type UsageRow = {
  app_user_id: string;
  tier: SubscriptionTier;
  period_start: Date;
  image_count: number;
};

export const TIER_LIMITS: Record<SubscriptionTier, number> = {
  starter: 40,
  premium: 100,
};

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS usage_counters (
  app_user_id    TEXT PRIMARY KEY,
  tier           TEXT NOT NULL CHECK (tier IN ('starter','premium')),
  period_start   TIMESTAMPTZ NOT NULL,
  image_count    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_usage_counters_period ON usage_counters(period_start);
`;

let pool: pg.Pool | null = null;

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }

  pool ??= new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

export async function applySchema() {
  await getPool().query(SCHEMA_SQL);
}

async function withClient<T>(fn: (client: PoolClient) => Promise<T>) {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

function isSubscriptionTier(value: unknown): value is SubscriptionTier {
  return value === "starter" || value === "premium";
}

function addBillingMonth(date: Date) {
  const resetAt = new Date(date.getTime());
  resetAt.setUTCMonth(resetAt.getUTCMonth() + 1);
  return resetAt;
}

function toQuota(row: UsageRow): UsageQuota {
  return {
    used: row.image_count,
    limit: TIER_LIMITS[row.tier],
    resetAt: addBillingMonth(row.period_start).toISOString(),
    tier: row.tier,
  };
}

function normalizeUsageRow(row: Record<string, unknown>): UsageRow {
  if (
    typeof row["app_user_id"] !== "string" ||
    !isSubscriptionTier(row["tier"]) ||
    !(row["period_start"] instanceof Date) ||
    typeof row["image_count"] !== "number"
  ) {
    throw new Error("Invalid usage_counters row");
  }

  return {
    app_user_id: row["app_user_id"],
    tier: row["tier"],
    period_start: row["period_start"],
    image_count: row["image_count"],
  };
}

async function resetIfExpired(client: PoolClient, row: UsageRow) {
  const resetAt = addBillingMonth(row.period_start);
  if (Date.now() < resetAt.getTime()) return row;

  const result = await client.query<Record<string, unknown>>(
    `
      UPDATE usage_counters
      SET period_start = NOW(), image_count = 0
      WHERE app_user_id = $1
      RETURNING app_user_id, tier, period_start, image_count
    `,
    [row.app_user_id],
  );

  if (!result.rows[0]) throw new Error("Failed to reset expired usage counter");
  return normalizeUsageRow(result.rows[0]);
}

async function ensureUsageCounter(
  client: PoolClient,
  appUserId: string,
  tier: SubscriptionTier,
  lock: boolean,
) {
  const selectSql = `
    SELECT app_user_id, tier, period_start, image_count
    FROM usage_counters
    WHERE app_user_id = $1
    ${lock ? "FOR UPDATE" : ""}
  `;
  const existing = await client.query<Record<string, unknown>>(selectSql, [appUserId]);
  if (existing.rows[0]) {
    return resetIfExpired(client, normalizeUsageRow(existing.rows[0]));
  }

  const created = await client.query<Record<string, unknown>>(
    `
      INSERT INTO usage_counters (app_user_id, tier, period_start, image_count)
      VALUES ($1, $2, NOW(), 0)
      RETURNING app_user_id, tier, period_start, image_count
    `,
    [appUserId, tier],
  );

  if (!created.rows[0]) throw new Error("Failed to create usage counter");
  return normalizeUsageRow(created.rows[0]);
}

export async function getUsageQuota(appUserId: string, defaultTier: SubscriptionTier = "starter") {
  return withClient(async (client) => {
    const row = await ensureUsageCounter(client, appUserId, defaultTier, false);
    return toQuota(row);
  });
}

export async function reserveImageQuota(appUserId: string, imageCount: number) {
  if (imageCount <= 0) {
    const quota = await getUsageQuota(appUserId);
    return {
      allowed: true as const,
      remaining: Math.max(0, quota.limit - quota.used),
      quota,
    };
  }

  return withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const row = await ensureUsageCounter(client, appUserId, "starter", true);
      const limit = TIER_LIMITS[row.tier];
      const remaining = Math.max(0, limit - row.image_count);

      if (imageCount > remaining) {
        await client.query("ROLLBACK");
        return { allowed: false as const, remaining, quota: toQuota(row) };
      }

      const updated = await client.query<Record<string, unknown>>(
        `
          UPDATE usage_counters
          SET image_count = image_count + $2
          WHERE app_user_id = $1
          RETURNING app_user_id, tier, period_start, image_count
        `,
        [appUserId, imageCount],
      );
      if (!updated.rows[0]) throw new Error("Failed to update usage counter");

      await client.query("COMMIT");
      return {
        allowed: true as const,
        remaining: Math.max(0, limit - normalizeUsageRow(updated.rows[0]).image_count),
        quota: toQuota(normalizeUsageRow(updated.rows[0])),
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function resetUsageCounter(appUserId: string, tier: SubscriptionTier) {
  return withClient(async (client) => {
    const result = await client.query<Record<string, unknown>>(
      `
        INSERT INTO usage_counters (app_user_id, tier, period_start, image_count)
        VALUES ($1, $2, NOW(), 0)
        ON CONFLICT (app_user_id)
        DO UPDATE SET tier = EXCLUDED.tier, period_start = NOW(), image_count = 0
        RETURNING app_user_id, tier, period_start, image_count
      `,
      [appUserId, tier],
    );

    if (!result.rows[0]) throw new Error("Failed to reset usage counter");
    return toQuota(normalizeUsageRow(result.rows[0]));
  });
}

export async function updateUsageTier(appUserId: string, tier: SubscriptionTier) {
  return withClient(async (client) => {
    const row = await ensureUsageCounter(client, appUserId, tier, false);
    const result = await client.query<Record<string, unknown>>(
      `
        UPDATE usage_counters
        SET tier = $2
        WHERE app_user_id = $1
        RETURNING app_user_id, tier, period_start, image_count
      `,
      [row.app_user_id, tier],
    );

    if (!result.rows[0]) throw new Error("Failed to update usage tier");
    return toQuota(normalizeUsageRow(result.rows[0]));
  });
}

export function mapEntitlementToTier(entitlementId: string | null | undefined): SubscriptionTier {
  return entitlementId === "premium" ? "premium" : "starter";
}
