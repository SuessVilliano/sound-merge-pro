import { requireUser } from "../_lib/auth.js";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const callGemini = async ({ prompt, json = false, image }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error("Gemini is not configured"), { status: 503 });

  const parts = [{ text: prompt }];
  if (image?.data && image?.mimeType) {
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: json ? { responseMimeType: "application/json", temperature: 0.7 } : { temperature: 0.7 }
      })
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw Object.assign(new Error(data?.error?.message || "Gemini request failed"), { status: response.status });
  }

  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
  if (!json) return text.trim();

  const cleaned = text.trim().replace(/^\`\`\`json\s*/i, "").replace(/^\`\`\`/, "").replace(/\`\`\`$/, "");
  try { return JSON.parse(cleaned); }
  catch { throw Object.assign(new Error("Gemini returned invalid JSON"), { status: 502 }); }
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireUser(req, res);
  if (!user) return;

  const { task, payload = {} } = req.body || {};

  try {
    switch (task) {
      case "chat": {
        const { message = "", context = {} } = payload;
        const goal = context?.user?.primaryGoal ? `Primary goal: ${context.user.primaryGoal}.` : "";
        const pending = Array.isArray(context?.pendingDistributions) ? context.pendingDistributions.length : 0;
        const text = await callGemini({
          prompt: `You are an elite music-industry strategist inside Sound Merge.
Respond in plain text only, concise and actionable, maximum 3 sentences.
Current app view: ${context.currentView || "unknown"}.
Role: ${context.agentRole || "Consultant"}.
Stats supplied by app: ${context?.stats?.totalStreams || 0} streams; ${context?.stats?.totalEarnings || 0} earnings.
${goal}
Pending distribution releases: ${pending}.
User message: ${message}`
        });
        return res.status(200).json({ text });
      }

      case "studio_suggestions": {
        const result = await callGemini({
          json: true,
          prompt: `Act as a professional music production team.
Style: "${payload.styleInput || ""}"
Lyrics/notes: "${payload.lyrics || ""}"
Return a JSON array of exactly 3 objects with keys:
agentId ("beat"|"melody"|"engineer"), type ("beat"|"vocal"|"fx"), title, description, promptAddon.
Do not imitate a living artist by name; describe musical characteristics directly.`
        });
        return res.status(200).json({ data: Array.isArray(result) ? result : [] });
      }

      case "parse_brief": {
        const data = await callGemini({
          json: true,
          prompt: `Normalize this music sync opportunity into structured JSON. Preserve only facts present in the input.
Useful keys: title, description, mediaType, deadline, budget, requiredGenres, moods, tempo, vocal, references, deliverables, usage, territory.
INPUT:
${payload.rawText || ""}`
        });
        return res.status(200).json({ data });
      }

      case "brief_artifacts": {
        const brief = payload.brief || {};
        const data = await callGemini({
          json: true,
          prompt: `Create a production blueprint for this sync brief:
Title: ${brief.title || ""}
Description: ${brief.description || ""}
Return JSON with exactly:
{
 "productionPromptPack":{"arrangement":"","mood":"","tempo":"","genre":"","instruments":[],"keywordsInclude":[]},
 "pitchChecklist":{"technical":[],"legal":[]}
}`
        });
        return res.status(200).json({ data });
      }

      case "pitch_email": {
        const opportunity = payload.opportunity || {};
        const text = await callGemini({
          prompt: `Write a concise professional music licensing pitch email body for the opportunity "${opportunity.brief_title || ""}" using track "${payload.trackTitle || ""}". Do not invent credits, placements, rights status, or metrics.`
        });
        return res.status(200).json({ text });
      }

      case "battle_commentary": {
        const text = await callGemini({
          prompt: `Write one energetic but neutral sentence introducing a ${payload.genre || ""} music battle: ${payload.p1 || ""} vs ${payload.p2 || ""}. Status: ${payload.status || ""}.`
        });
        return res.status(200).json({ text });
      }

      case "proactive_proposal": {
        const context = payload.context || {};
        const data = await callGemini({
          json: true,
          prompt: `You are an AI staff member in Sound Merge.
Role: ${context.agentRole || "manager"}
Current view: ${context.currentView || ""}
Primary goal: ${context?.user?.primaryGoal || ""}
Return one useful JSON proposal with keys: type ("opportunity"|"warning"|"strategy"), title, description, impact ("high"|"medium"|"low"), actionLabel.
Do not invent external data; base it only on the supplied context.`
        });
        return res.status(200).json({ data });
      }

      case "analyze_image": {
        const raw = String(payload.imgBase64 || "");
        const match = raw.match(/^data:([^;]+);base64,(.+)$/);
        const mimeType = match?.[1] || "image/png";
        const imageData = match?.[2] || raw;
        const data = await callGemini({
          json: true,
          image: { mimeType, data: imageData },
          prompt: "List the visible objects, visual themes, and design traits in this image as a JSON array of short strings."
        });
        return res.status(200).json({ data: Array.isArray(data) ? data : [] });
      }

      default:
        return res.status(400).json({ error: "Unsupported AI task" });
    }
  } catch (error) {
    console.error("[AI Task]", task, error);
    return res.status(error?.status || 500).json({ error: error?.message || "AI task failed" });
  }
}
