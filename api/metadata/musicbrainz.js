import { requireUser } from "../_lib/auth.js";

const ENTITY_PATHS = {
  artist: "artist",
  recording: "recording",
  release: "release",
  work: "work"
};

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireUser(req, res);
  if (!user) return;

  const { entity = "recording", q = "", limit = "8" } = req.query || {};
  const path = ENTITY_PATHS[entity];
  if (!path) return res.status(400).json({ error: "Unsupported MusicBrainz entity" });
  if (!String(q).trim()) return res.status(400).json({ error: "q is required" });

  const safeLimit = Math.max(1, Math.min(Number(limit) || 8, 20));
  const url = `https://musicbrainz.org/ws/2/${path}/?query=${encodeURIComponent(String(q))}&limit=${safeLimit}&fmt=json`;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "SoundMerge/3.1 (metadata reconciliation)"
      }
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error || "MusicBrainz lookup failed" });
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error("[MusicBrainz]", error);
    return res.status(502).json({ error: "MusicBrainz unavailable" });
  }
}
