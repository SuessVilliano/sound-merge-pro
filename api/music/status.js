import { requireUser } from "../_lib/auth.js";
import { getByokKey, getSunoByokUrls } from "../_lib/byok.js";

const normalizeMureka = (data, taskType) => {
  const choice = Array.isArray(data?.choices) ? data.choices[0] : null;
  return {
    provider: "mureka",
    taskType,
    taskId: data?.id || data?.task_id || null,
    status: data?.status || "queued",
    model: data?.model || null,
    failedReason: data?.failed_reason || null,
    audioUrl: choice?.wav_url || choice?.url || choice?.audio_url || choice?.stream_url || null,
    imageUrl: choice?.cover_url || choice?.image_url || null,
    title: choice?.title || null,
    duration: choice?.duration || choice?.duration_ms || null,
    rawChoice: choice || null
  };
};

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireUser(req, res);
  if (!user) return;

  const { provider, id, taskType = "song" } = req.query || {};
  if (!provider || !id) return res.status(400).json({ error: "provider and id are required" });

  if (provider === "mureka") {
    const byokKey = getByokKey(req);
    const apiKey = byokKey || process.env.MUREKA_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Mureka is not configured. Add your Mureka key in Integration Center." });

    const url = taskType === "instrumental"
      ? `https://api.mureka.ai/v1/instrumental/query/${encodeURIComponent(id)}`
      : `https://api.mureka.ai/v1/song/query/${encodeURIComponent(id)}`;

    try {
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data?.error?.message || "Mureka status query failed" });
      }

      return res.status(200).json(normalizeMureka(data, taskType));
    } catch (error) {
      console.error("[MusicGateway] Mureka status unavailable", error);
      return res.status(502).json({ error: "Mureka status unavailable" });
    }
  }

  if (provider === "suno") {
    const byokKey = getByokKey(req);
    const byokUrls = getSunoByokUrls(req);
    const apiKey = byokKey || process.env.SUNO_API_KEY;
    const statusTemplate = byokUrls.statusUrl || process.env.SUNO_STATUS_URL;

    if (!apiKey || !statusTemplate) {
      return res.status(503).json({ error: "Suno status is not configured. Add your Suno API key and status endpoint in Integration Center." });
    }

    const url = statusTemplate.includes("{id}")
      ? statusTemplate.replace("{id}", encodeURIComponent(id))
      : `${statusTemplate.replace(/\/$/, "")}/${encodeURIComponent(id)}`;

    try {
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data?.error?.message || data?.message || "Suno status query failed" });
      }

      return res.status(200).json({
        provider: "suno",
        taskType: "song",
        taskId: data?.id || data?.task_id || data?.taskId || id,
        status: data?.status || "processing",
        audioUrl: data?.audio_url || data?.audioUrl || data?.url || null,
        imageUrl: data?.image_url || data?.imageUrl || null,
        title: data?.title || null,
        raw: data
      });
    } catch (error) {
      console.error("[MusicGateway] Suno status unavailable", error);
      return res.status(502).json({ error: "Suno status unavailable" });
    }
  }

  return res.status(400).json({ error: `Unsupported provider: ${provider}` });
}
