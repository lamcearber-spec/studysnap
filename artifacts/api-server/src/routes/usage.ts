import { Router } from "express";
import { z } from "zod";
import {
  getUsageQuota,
  mapEntitlementToTier,
  reserveImageQuota,
  resetUsageCounter,
  updateUsageTier,
} from "../db/client.js";

const router = Router();

const usageQuerySchema = z.object({
  appUserId: z.string().min(1),
});

const checkBodySchema = z.object({
  appUserId: z.string().min(1),
  imageCount: z.coerce.number().int().min(0).default(0),
});

const webhookEventSchema = z.object({
  type: z.string().optional(),
  app_user_id: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  entitlement_id: z.string().optional(),
  entitlement_ids: z.array(z.string()).optional(),
  product_id: z.string().optional(),
});

function verifyRevenueCatWebhook(req: { get(name: string): string | undefined }) {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret) return true;

  const authorization = req.get("authorization");
  const signature = req.get("x-revenuecat-signature");
  return authorization === secret || authorization === `Bearer ${secret}` || signature === secret;
}

function pickAppUserId(event: z.infer<typeof webhookEventSchema>) {
  return event.app_user_id ?? event.aliases?.[0] ?? null;
}

function pickEntitlementId(event: z.infer<typeof webhookEventSchema>) {
  if (event.entitlement_id) return event.entitlement_id;
  if (event.entitlement_ids?.includes("premium")) return "premium";
  if (event.entitlement_ids?.includes("starter")) return "starter";
  if (event.product_id?.includes("premium")) return "premium";
  if (event.product_id?.includes("starter")) return "starter";
  return null;
}

router.get("/usage", async (req, res) => {
  const parsed = usageQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "appUserId is required" });
    return;
  }

  try {
    res.json(await getUsageQuota(parsed.data.appUserId));
  } catch (error) {
    req.log.error({ error }, "Failed to fetch usage");
    res.status(500).json({ error: "Failed to fetch usage" });
  }
});

router.post("/usage/check", async (req, res) => {
  const parsed = checkBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid usage check body" });
    return;
  }

  try {
    const result = await reserveImageQuota(parsed.data.appUserId, parsed.data.imageCount);
    if (!result.allowed) {
      res.status(402).json({ error: "QUOTA_EXCEEDED", quota: result.quota });
      return;
    }
    res.json(result.quota);
  } catch (error) {
    req.log.error({ error }, "Failed to check usage");
    res.status(500).json({ error: "Failed to check usage" });
  }
});

router.post("/revenuecat/webhook", async (req, res) => {
  if (!verifyRevenueCatWebhook(req)) {
    res.status(401).json({ error: "Invalid RevenueCat webhook signature" });
    return;
  }

  const payload = req.body as { event?: unknown };
  const parsed = webhookEventSchema.safeParse(payload.event ?? payload);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid RevenueCat webhook payload" });
    return;
  }

  const event = parsed.data;
  const appUserId = pickAppUserId(event);
  if (!appUserId) {
    res.status(400).json({ error: "Missing app_user_id" });
    return;
  }

  const tier = mapEntitlementToTier(pickEntitlementId(event));
  const type = event.type ?? "";

  try {
    if (type === "INITIAL_PURCHASE" || type === "RENEWAL") {
      const quota = await resetUsageCounter(appUserId, tier);
      res.json({ ok: true, quota });
      return;
    }

    if (type === "PRODUCT_CHANGE" || type === "UNCANCELLATION") {
      const quota = await updateUsageTier(appUserId, tier);
      res.json({ ok: true, quota });
      return;
    }

    res.json({ ok: true });
  } catch (error) {
    req.log.error({ error, appUserId }, "Failed to process RevenueCat webhook");
    res.status(500).json({ error: "Failed to process RevenueCat webhook" });
  }
});

export default router;

