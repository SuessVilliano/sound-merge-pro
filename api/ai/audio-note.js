import { requireUser } from "../_lib/auth.js";
import { getByokKey } from "../_lib/byok.js";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const parseJson = (text) => {
  const cleaned = String(text || "").trim().replace(/^```json\s*/i, "").replace(/^```/, "").replace(/```$/, "");
  return JSON.parse(cleaned);
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireUser(req, res);
  if (!user) return;

  const byokKey = getByokKey(req);
  const apiKey = byokKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Gemini audio understanding is not configured. Add your Gemini key in Integration Center." });

  const { audioBase64 = "", mimeType = "audio/webm", context = "" } = req.body || {};
  if (!audioBase64) return res.status(400).json({ error: "audioBase64 is required" });

  const raw = String(audioBase64).replace(/^data:[^;]+;base64,/, "");
  const approxBytes = Math.ceil(raw.length * 0.75);
  if (approxBytes > 18 * 1024 * 1024) {
    return res.status(413).json({ error: "Voice memo is too large for inline analysis. Keep the note shorter or upload through a file workflow." });
  }

  const instruction = `
You are Sound Merge's songwriting and A&R notebook assistant.
Analyze this rough voice memo from an artist. It may contain spoken lyrics, singing, humming,
rhythmic ideas, production instructions, or casual notes.

Return ONLY JSON:
{
  "transcript": "best-effort spoken/sung words; blank if no intelligible words",
  "lyricDraft": "cleaned lyric fragments or short structured draft based only on audible words/intent",
  "musicDirection": "tempo feel, mood, genre traits, rhythm, instrumentation or melody observations",
  "promptSeed": "one concise production/generation prompt derived from the memo",
  "notes": ["short useful observation 1","observation 2"]
}

Do not claim exact BPM, key, chords, or melody notes unless they are confidently audible.
If the person is humming rather than speaking, describe the contour/rhythm qualitatively instead of inventing lyrics.
Extra context from the artist: ${context || "(none)"}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { text: instruction },
              { inlineData: { mimeType, data: raw } }
            ]
          }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.4 }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || "Voice memo analysis failed" });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "{}";
    return res.status(200).json({ model: MODEL, credentialSource: byokKey ? "artist_byok" : "sound_merge", analysis: parseJson(text) });
  } catch (error) {
    console.error("[AudioNote]", error);
    return res.status(500).json({ error: error?.message || "Voice memo analysis unavailable" });
  }
}
