import { requireUser } from "../_lib/auth.js";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const safeJson = (text) => {
  if (!text) return null;
  const cleaned = text.trim().replace(/^\`\`\`json\s*/i, "").replace(/^\`\`\`/, "").replace(/\`\`\`$/, "");
  try { return JSON.parse(cleaned); } catch { return null; }
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireUser(req, res);
  if (!user) return;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Gemini is not configured" });

  const {
    brief = "",
    currentStyle = "",
    currentLyrics = "",
    instrumental = false,
    targetEngine = "suno"
  } = req.body || {};

  if (!brief.trim() && !currentStyle.trim() && !currentLyrics.trim()) {
    return res.status(400).json({ error: "Give Sound Merge an idea, style, or lyric fragment first." });
  }

  const instruction = `
You are Sound Merge's senior music producer and prompt architect.

Turn the user's rough musical idea into a production-ready prompt pack for ${targetEngine}.
Do not name living artists as style targets. Describe musical traits directly.
Preserve the user's intent and voice. Be specific about groove, BPM range, harmony, instrumentation,
vocal delivery, arrangement, dynamics, emotional arc, and mix character.

Return ONLY valid JSON with this exact shape:
{
  "title": "short original title",
  "stylePrompt": "single generation-ready music prompt, <= 900 characters",
  "lyrics": "complete structured lyrics with section labels, or empty string for instrumental",
  "negativePrompt": "things to avoid",
  "tags": ["tag1","tag2","tag3","tag4","tag5"],
  "bpm": 120,
  "keyFeel": "e.g. minor / warm modal / bright major",
  "structure": ["Intro","Verse 1","Hook","Verse 2","Bridge","Final Hook","Outro"],
  "generationNotes": "one concise paragraph with practical generation guidance"
}

USER BRIEF:
${brief}

CURRENT STYLE:
${currentStyle}

CURRENT LYRICS / NOTES:
${currentLyrics}

INSTRUMENTAL ONLY:
${instrumental ? "yes" : "no"}

TARGET ENGINE:
${targetEngine}

If instrumental is yes, lyrics MUST be an empty string.
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: instruction }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.8
          }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("[PromptPack] Gemini error", data);
      return res.status(response.status).json({ error: data?.error?.message || "Prompt architect failed" });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    const pack = safeJson(text);

    if (!pack) {
      return res.status(502).json({ error: "Prompt architect returned an invalid payload" });
    }

    return res.status(200).json({ model: MODEL, pack });
  } catch (error) {
    console.error("[PromptPack] Error", error);
    return res.status(500).json({ error: "Prompt architect unavailable" });
  }
}
