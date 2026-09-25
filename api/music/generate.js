import { requireUser } from "../_lib/auth.js";

const normalizeMureka = (data, taskType) => {
  const choice = Array.isArray(data?.choices) ? data.choices[0] : null;
  return {
    provider: "mureka",
    taskType,
    taskId: data?.id || data?.task_id || null,
    status: data?.status || "queued",
    model: data?.model || "auto",
    failedReason: data?.failed_reason || null,
    audioUrl: choice?.wav_url || choice?.url || choice?.audio_url || choice?.stream_url || null,
    imageUrl: choice?.cover_url || choice?.image_url || null,
    title: choice?.title || null,
    rawChoice: choice || null
  };
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireUser(req, res);
  if (!user) return;

  const {
    provider,
    prompt = "",
    lyrics = "",
    instrumental = false,
    vocalGender,
    title = ""
  } = req.body || {};

  if (!provider) return res.status(400).json({ error: "Provider is required" });
  if (!prompt.trim()) return res.status(400).json({ error: "Prompt is required" });

  if (provider === "udio") {
    return res.status(409).json({
      error: "Udio does not expose a public API. Use the browser-agent workflow instead.",
      mode: "browser_agent"
    });
  }

  if (provider === "mureka") {
    const apiKey = process.env.MUREKA_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Mureka is not configured" });

    const taskType = instrumental ? "instrumental" : "song";
    if (!instrumental && !lyrics.trim()) {
      return res.status(400).json({ error: "Mureka lyric-to-song generation requires lyrics. Use Prompt Architect first." });
    }

    const url = instrumental
      ? "https://api.mureka.ai/v1/instrumental/generate"
      : "https://api.mureka.ai/v1/song/generate";

    const body = instrumental
      ? { model: "auto", prompt: prompt.slice(0, 1024), n: 1 }
      : {
          model: "auto",
          prompt: prompt.slice(0, 1024),
          lyrics: lyrics.slice(0, 5000),
          n: 1,
          ...(vocalGender === "male" || vocalGender === "female" ? { gender: vocalGender } : {})
        };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (!response.ok) {
        console.error("[MusicGateway] Mureka generate error", data);
        return res.status(response.status).json({ error: data?.error?.message || "Mureka generation failed" });
      }

      return res.status(200).json(normalizeMureka(data, taskType));
    } catch (error) {
      console.error("[MusicGateway] Mureka unavailable", error);
      return res.status(502).json({ error: "Mureka provider unavailable" });
    }
  }

  if (provider === "suno") {
    const apiKey = process.env.SUNO_API_KEY;
    const generateUrl = process.env.SUNO_GENERATE_URL;

    if (!apiKey) return res.status(503).json({ error: "Suno API is not configured. Add SUNO_API_KEY from Suno Platform." });
    if (!generateUrl) {
      return res.status(503).json({
        error: "Suno API key is present, but the Sound Merge adapter still needs SUNO_GENERATE_URL from your Suno Platform API documentation.",
        mode: "adapter_needed"
      });
    }

    try {
      const response = await fetch(generateUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt,
          lyrics: instrumental ? "" : lyrics,
          instrumental,
          title
        })
      });
      const data = await response.json();

      if (!response.ok) {
        console.error("[MusicGateway] Suno generate error", data);
        return res.status(response.status).json({ error: data?.error?.message || data?.message || "Suno generation failed" });
      }

      return res.status(200).json({
        provider: "suno",
        taskType: "song",
        taskId: data?.id || data?.task_id || data?.taskId || null,
        status: data?.status || "queued",
        audioUrl: data?.audio_url || data?.audioUrl || data?.url || null,
        imageUrl: data?.image_url || data?.imageUrl || null,
        title: data?.title || title || null,
        raw: data
      });
    } catch (error) {
      console.error("[MusicGateway] Suno unavailable", error);
      return res.status(502).json({ error: "Suno provider unavailable" });
    }
  }

  return res.status(400).json({ error: `Unsupported provider: ${provider}` });
}
