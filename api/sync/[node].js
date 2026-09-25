import { requireUser } from "../_lib/auth.js";

const RAPID_API_KEY = process.env.RAPID_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireUser(req, res);
  if (!user) return;

  const { node, q = "", type = "multi", id = "", isrc = "" } = req.query || {};

  if (!RAPID_API_KEY) {
    return res.status(503).json({ error: "RapidAPI is not configured" });
  }

  let apiUrl = "";
  let host = "";

  switch (node) {
    case "spotify-search":
      if (!q) return res.status(400).json({ error: "q is required" });
      apiUrl = `https://spotify23.p.rapidapi.com/search/?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}&offset=0&limit=15`;
      host = "spotify23.p.rapidapi.com";
      break;
    case "spotify-streams":
      if (!id) return res.status(400).json({ error: "id is required" });
      apiUrl = `https://spotify-track-streams-playback-count1.p.rapidapi.com/tracks/spotify_track_streams?spotify_track_id=${encodeURIComponent(id)}${isrc ? `&isrc=${encodeURIComponent(isrc)}` : ""}`;
      host = "spotify-track-streams-playback-count1.p.rapidapi.com";
      break;
    case "billboard":
      apiUrl = "https://billboard-api2.p.rapidapi.com/hot-100?range=1-100";
      host = "billboard-api2.p.rapidapi.com";
      break;
    default:
      return res.status(400).json({ error: "Invalid sync node" });
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        "X-RapidAPI-Key": RAPID_API_KEY,
        "X-RapidAPI-Host": host
      }
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error(`[RapidProxy] Error fetching from ${host}`, error);
    return res.status(502).json({ error: "Failed to synchronize with industry node" });
  }
}
