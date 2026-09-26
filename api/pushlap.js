import { requireUser } from "./_lib/auth.js";

const ENDPOINTS = {
  signup: "https://www.pushlapgrowth.com/api/v1/referrals",
  sale: "https://www.pushlapgrowth.com/api/v1/sales"
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await requireUser(req, res);
  if (!user) return;

  const apiKey = String(process.env.PUSHLAP_API_KEY || "").trim();
  if (!apiKey) return res.status(503).json({ error: "Affiliate tracking is not configured" });

  const { action, payload } = req.body || {};
  if (!ENDPOINTS[action]) return res.status(400).json({ error: "Unsupported affiliate action" });

  try {
    const response = await fetch(ENDPOINTS[action], {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload || {})
    });

    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch { data = { message: text }; }

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error || data?.message || "Affiliate provider request failed" });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("[PushLap]", error?.message || error);
    return res.status(502).json({ error: "Affiliate provider unavailable" });
  }
}
