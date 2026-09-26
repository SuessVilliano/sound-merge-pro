import { requireUser } from "../_lib/auth.js";
import { getHiggsfieldByok } from "../_lib/byok.js";

const BASE = "https://api.higgsfield.ai";
const DEFAULT_MODEL = "bytedance/seedance-2.0/text-to-video";

const getCredentials = (req) => {
  const byok = getHiggsfieldByok(req);
  if (byok.keyId && byok.keySecret) {
    return { keyId: byok.keyId, keySecret: byok.keySecret, source: "artist_byok" };
  }

  const keyId = String(process.env.HIGGSFIELD_API_KEY_ID || "").trim();
  const keySecret = String(process.env.HIGGSFIELD_API_KEY_SECRET || "").trim();
  if (keyId && keySecret) return { keyId, keySecret, source: "sound_merge" };
  return null;
};

const authHeaders = (creds) => ({
  Authorization: `Key ${creds.keyId}:${creds.keySecret}`,
  "Content-Type": "application/json"
});

const safeModelPath = (raw) => {
  const value = String(raw || DEFAULT_MODEL).trim();
  if (!/^[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+){2,5}$/.test(value) || value.includes("..")) {
    return DEFAULT_MODEL;
  }
  return value;
};

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  const creds = getCredentials(req);
  if (!creds) {
    return res.status(503).json({
      error: "Higgsfield API is not configured. Add your Key ID and Key Secret in Integration Center or connect Sound Merge credentials."
    });
  }

  if (req.method === "POST") {
    const {
      prompt = "",
      duration = 5,
      aspectRatio = "16:9",
      resolution = "720p",
      generateAudio = true,
      modelPath = DEFAULT_MODEL
    } = req.body || {};

    if (!String(prompt).trim()) return res.status(400).json({ error: "prompt is required" });

    const safeDuration = Math.max(2, Math.min(Number(duration) || 5, 15));
    const safeAspect = ["16:9", "9:16", "1:1"].includes(aspectRatio) ? aspectRatio : "16:9";
    const safeResolution = ["720p", "1080p"].includes(resolution) ? resolution : "720p";
    const path = safeModelPath(modelPath);

    try {
      const response = await fetch(`${BASE}/${path}`, {
        method: "POST",
        headers: authHeaders(creds),
        body: JSON.stringify({
          prompt: String(prompt).slice(0, 5000),
          resolution: safeResolution,
          generate_audio: Boolean(generateAudio),
          duration: safeDuration,
          aspect_ratio: safeAspect
        })
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          error: data?.detail || data?.error || "Higgsfield generation request failed"
        });
      }

      return res.status(200).json({
        credentialSource: creds.source,
        modelPath: path,
        requestId: data?.request_id,
        status: data?.status || "queued",
        statusUrl: data?.status_url || null
      });
    } catch (error) {
      console.error("[HiggsfieldGateway] submit failed", error?.message || error);
      return res.status(502).json({ error: "Higgsfield API is unavailable" });
    }
  }

  if (req.method === "GET") {
    const id = String(req.query?.id || "").trim();
    if (!/^[0-9a-fA-F-]{20,64}$/.test(id)) return res.status(400).json({ error: "Valid request id is required" });

    try {
      const response = await fetch(`${BASE}/requests/${encodeURIComponent(id)}/status`, {
        headers: authHeaders(creds)
      });
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: data?.detail || data?.error || "Higgsfield status request failed"
        });
      }

      return res.status(200).json({
        credentialSource: creds.source,
        requestId: data?.request_id || id,
        status: data?.status || "queued",
        error: data?.error || null,
        videoUrl: data?.video?.url || null,
        imageUrls: Array.isArray(data?.images) ? data.images.map(x => x?.url).filter(Boolean) : [],
        audioUrl: data?.audio?.url || null
      });
    } catch (error) {
      console.error("[HiggsfieldGateway] status failed", error?.message || error);
      return res.status(502).json({ error: "Higgsfield status is unavailable" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
