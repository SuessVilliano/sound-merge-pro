import { requireUser } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireUser(req, res);
  if (!user) return;

  const destination = process.env.SYSTEM_BACKUP_WEBHOOK;
  if (!destination) return res.status(503).json({ error: "System webhook is not configured" });

  const { event, user: eventUser, ...rest } = req.body || {};
  if (!event) return res.status(400).json({ error: "event is required" });

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    authenticatedUserId: user.uid,
    user: eventUser || {},
    ...rest
  };

  try {
    const response = await fetch(destination, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    return res.status(response.ok ? 200 : 502).json({
      success: response.ok,
      upstreamStatus: response.status,
      response: responseText.slice(0, 1000)
    });
  } catch (error) {
    console.error("[SystemWebhook] Delivery failed", error);
    return res.status(502).json({ error: "System webhook delivery failed" });
  }
}
