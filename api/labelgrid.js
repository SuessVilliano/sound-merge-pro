import { requireUser } from "./_lib/auth.js";

const PROD_BASE = "https://api.labelgrid.com/api/public";
const SANDBOX_BASE = process.env.LABELGRID_SANDBOX_BASE_URL || "https://api-sandbox.stg.labelgrid.com/api/public";

const configured = () => Boolean(process.env.LABELGRID_API_TOKEN);

const baseUrl = () => {
  const mode = (process.env.LABELGRID_ENV || "production").toLowerCase();
  return mode === "sandbox" ? SANDBOX_BASE : PROD_BASE;
};

async function lgFetch(path, options = {}) {
  const token = process.env.LABELGRID_API_TOKEN;
  if (!token) throw Object.assign(new Error("LabelGrid is not configured"), { status: 503 });

  const response = await fetch(`${baseUrl()}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

  if (!response.ok) {
    const message = data?.message || data?.error || `LabelGrid request failed (${response.status})`;
    throw Object.assign(new Error(typeof message === "string" ? message : JSON.stringify(message)), { status: response.status, data });
  }

  return data;
}

export default async function handler(req, res) {
  if (!["GET","POST"].includes(req.method)) return res.status(405).json({ error: "Method not allowed" });
  const user = await requireUser(req, res);
  if (!user) return;

  const action = req.method === "GET" ? req.query?.action : req.body?.action;
  const body = req.body || {};

  if (action === "connection") {
    if (!configured()) return res.status(200).json({ configured: false, environment: process.env.LABELGRID_ENV || "production" });
    try {
      const me = await lgFetch("/me");
      return res.status(200).json({ configured: true, connected: true, environment: process.env.LABELGRID_ENV || "production", me });
    } catch (error) {
      return res.status(error?.status || 502).json({ configured: true, connected: false, error: error?.message || "LabelGrid unavailable" });
    }
  }

  try {
    switch (action) {
      case "releases":
        return res.status(200).json(await lgFetch("/releases"));
      case "release": {
        if (!req.query?.id) return res.status(400).json({ error: "id required" });
        return res.status(200).json(await lgFetch(`/releases/${encodeURIComponent(req.query.id)}`));
      }
      case "delivery_status": {
        const id = req.query?.id || body.releaseId;
        if (!id) return res.status(400).json({ error: "releaseId required" });
        return res.status(200).json(await lgFetch(`/releases/${encodeURIComponent(id)}/delivery-status`));
      }
      case "analytics_summary":
        return res.status(200).json(await lgFetch("/analytics/summary"));
      case "royalties":
        return res.status(200).json(await lgFetch("/royalties/breakdown"));
      case "statements":
        return res.status(200).json(await lgFetch("/statements"));
      case "transactions":
        return res.status(200).json(await lgFetch("/transactions"));
      case "outlets":
        return res.status(200).json(await lgFetch("/distro-outlets"));

      case "create_release": {
        if (req.method !== "POST") return res.status(405).json({ error: "POST required" });
        if (!body.payload || typeof body.payload !== "object") return res.status(400).json({ error: "payload required" });
        return res.status(200).json(await lgFetch("/releases", { method:"POST", body: JSON.stringify(body.payload) }));
      }

      case "validate_release": {
        if (req.method !== "POST") return res.status(405).json({ error: "POST required" });
        if (!body.releaseId) return res.status(400).json({ error: "releaseId required" });
        return res.status(200).json(await lgFetch(`/releases/${encodeURIComponent(body.releaseId)}/validate`, { method:"POST", body: JSON.stringify(body.payload || {}) }));
      }

      case "distribute_release": {
        if (req.method !== "POST") return res.status(405).json({ error: "POST required" });
        if (!body.releaseId) return res.status(400).json({ error: "releaseId required" });
        if (body.acknowledgement !== "I approve this release for distribution") {
          return res.status(409).json({
            error: "Final distribution is approval-gated.",
            requiredAcknowledgement: "I approve this release for distribution"
          });
        }
        return res.status(200).json(await lgFetch(`/releases/${encodeURIComponent(body.releaseId)}/distribute`, { method:"POST", body: JSON.stringify(body.payload || {}) }));
      }

      default:
        return res.status(400).json({ error: "Unsupported LabelGrid action" });
    }
  } catch (error) {
    console.error("[LabelGrid]", action, error);
    return res.status(error?.status || 502).json({ error: error?.message || "LabelGrid unavailable", details: error?.data });
  }
}
