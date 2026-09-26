import { requireUser } from "../_lib/auth.js";
import { getByokKey } from "../_lib/byok.js";

const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";

const stripDataUrl = (value = "") => {
  const match = String(value).match(/^data:([^;]+);base64,(.+)$/);
  return match ? { mimeType: match[1], data: match[2] } : null;
};

const findImage = (value, seen = new Set()) => {
  if (!value || typeof value !== "object" || seen.has(value)) return null;
  seen.add(value);

  const mime = value.mime_type || value.mimeType || value.media_type || value.mediaType;
  if (typeof value.data === "string" && typeof mime === "string" && mime.startsWith("image/")) {
    return { data: value.data, mimeType: mime };
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === "thoughts" || key === "thinking") continue;
    if (child && typeof child === "object") {
      const found = findImage(child, seen);
      if (found) return found;
    }
  }
  return null;
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireUser(req, res);
  if (!user) return;

  const byokKey = getByokKey(req);
  const apiKey = byokKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Nano Banana is not configured. Add your Gemini key in Integration Center." });

  const {
    prompt = "",
    title = "",
    artistName = "",
    aspectRatio = "1:1",
    imageSize = "2K",
    referenceImages = []
  } = req.body || {};

  if (!String(prompt).trim()) return res.status(400).json({ error: "prompt is required" });

  const artDirection = [
    "Create professional music release artwork suitable for commercial DSP cover art.",
    title ? `Release title: "${title}".` : "",
    artistName ? `Artist: "${artistName}".` : "",
    `Creative direction: ${prompt}`,
    "Make it visually striking at thumbnail size. Avoid mockup frames, watermarks, platform logos, barcodes, pricing stickers, or fake legal text.",
    "Only include title/artist typography if the creative direction asks for visible text; if text is requested, render it cleanly and legibly.",
    "Return only the artwork image."
  ].filter(Boolean).join("\n");

  const input = [{ type: "text", text: artDirection }];
  for (const raw of Array.isArray(referenceImages) ? referenceImages.slice(0, 5) : []) {
    const parsed = stripDataUrl(raw);
    if (parsed) {
      input.push({ type: "image", mime_type: parsed.mimeType, data: parsed.data });
    }
  }

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        input,
        response_format: {
          type: "image",
          mime_type: "image/png",
          aspect_ratio: aspectRatio,
          image_size: imageSize
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || "Nano Banana generation failed" });
    }

    const image = findImage(data);
    if (!image?.data) {
      return res.status(502).json({ error: "Nano Banana returned no image data" });
    }

    return res.status(200).json({
      model: MODEL,
      credentialSource: byokKey ? "artist_byok" : "sound_merge",
      mimeType: image.mimeType || "image/png",
      dataUrl: `data:${image.mimeType || "image/png"};base64,${image.data}`
    });
  } catch (error) {
    console.error("[Artwork]", error);
    return res.status(500).json({ error: error?.message || "Artwork generation failed" });
  }
}
