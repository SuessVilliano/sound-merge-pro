import { requireUser } from "../_lib/auth.js";
import { getByokKey } from "../_lib/byok.js";

const MODEL = "music_v2_5";
const MAX_PROMPT = 4100;

const getApiKey = (req) => {
  const byok = getByokKey(req);
  if (byok) return { key: byok, source: "artist_byok" };
  const platform = String(process.env.ELEVENLABS_API_KEY || "").trim();
  if (platform) return { key: platform, source: "sound_merge" };
  return null;
};

const buildPrompt = ({ prompt = "", lyrics = "", title = "", instrumental = false }) => {
  const sections = [
    title ? `Title: ${title}` : "",
    String(prompt || "").trim(),
    !instrumental && String(lyrics || "").trim()
      ? `Use these lyrics as the lyrical content and preserve their meaning and section order:\n${String(lyrics).trim()}`
      : ""
  ].filter(Boolean);

  return sections.join("\n\n").slice(0, MAX_PROMPT);
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireUser(req, res);
  if (!user) return;

  const creds = getApiKey(req);
  if (!creds) {
    return res.status(503).json({
      error: "ElevenLabs is not configured. Add your ElevenLabs API key in Integration Center or connect the Sound Merge key."
    });
  }

  const {
    prompt = "",
    lyrics = "",
    instrumental = false,
    title = "",
    durationDesired = 60
  } = req.body || {};

  const finalPrompt = buildPrompt({ prompt, lyrics, title, instrumental });
  if (!finalPrompt) return res.status(400).json({ error: "A music prompt is required" });

  const durationMs = Math.max(3000, Math.min((Number(durationDesired) || 60) * 1000, 300000));

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192", {
      method: "POST",
      headers: {
        "xi-api-key": creds.key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        music_length_ms: durationMs,
        model_id: MODEL,
        force_instrumental: Boolean(instrumental),
        store_for_inpainting: true,
        sign_with_c2pa: true
      })
    });

    if (!response.ok) {
      let message = "Eleven Music generation failed";
      try {
        const data = await response.json();
        message = data?.detail?.message || data?.detail || data?.error || message;
      } catch {}
      return res.status(response.status).json({ error: typeof message === "string" ? message : JSON.stringify(message) });
    }

    const audio = Buffer.from(await response.arrayBuffer());
    const songId = response.headers.get("song-id") || "";

    res.setHeader("Content-Type", response.headers.get("content-type") || "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-SM-Provider", "elevenlabs");
    res.setHeader("X-SM-Model", MODEL);
    res.setHeader("X-SM-Credential-Source", creds.source);
    if (songId) res.setHeader("X-SM-Song-Id", songId);

    return res.status(200).send(audio);
  } catch (error) {
    console.error("[ElevenMusic]", error?.message || error);
    return res.status(502).json({ error: "ElevenLabs Music API is unavailable" });
  }
}
