import { requireUser } from "./_lib/auth.js";

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  const refreshToken = process.env.CHARTMETRIC_REFRESH_TOKEN;
  if (!refreshToken) throw new Error("Chartmetric is not configured");

  if (cachedToken && Date.now() < tokenExpiresAt - 60000) return cachedToken;

  const response = await fetch("https://api.chartmetric.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshtoken: refreshToken })
  });

  const data = await response.json();
  if (!response.ok || !data?.token) {
    throw new Error(data?.error || "Chartmetric token exchange failed");
  }

  cachedToken = data.token;
  tokenExpiresAt = Date.now() + ((data.expires_in || 3600) * 1000);
  return cachedToken;
}

async function cmFetch(path) {
  const token = await getAccessToken();
  const response = await fetch(`https://api.chartmetric.com${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.error || data?.message || "Chartmetric request failed");
    error.status = response.status;
    throw error;
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireUser(req, res);
  if (!user) return;

  const { action, q = "", type = "artists", id, since, until } = req.query || {};

  try {
    if (action === "search") {
      if (!q || String(q).length < 2) return res.status(400).json({ error: "q must be at least 2 characters" });
      const data = await cmFetch(`/api/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}&limit=15`);
      return res.status(200).json(data);
    }

    if (action === "artist-analytics") {
      if (!id) return res.status(400).json({ error: "artist id is required" });
      const start = since ? String(since) : "";
      const end = until ? String(until) : "";
      const dateQuery = start && end ? `?since=${encodeURIComponent(start)}&until=${encodeURIComponent(end)}` : "";

      const [artist, cmStats, spotify] = await Promise.all([
        cmFetch(`/api/artist/${encodeURIComponent(id)}`),
        cmFetch(`/api/artist/${encodeURIComponent(id)}/cmStats`),
        cmFetch(`/api/artist/${encodeURIComponent(id)}/stat/spotify${dateQuery}`)
      ]);

      return res.status(200).json({
        artist: artist?.obj || artist,
        cmStats: cmStats?.obj || cmStats,
        spotify: spotify?.obj || spotify
      });
    }

    return res.status(400).json({ error: "Invalid Chartmetric action" });
  } catch (error) {
    console.error("[ChartmetricProxy]", error);
    const status = error?.status || (String(error?.message || "").includes("not configured") ? 503 : 502);
    return res.status(status).json({ error: error?.message || "Chartmetric unavailable" });
  }
}
