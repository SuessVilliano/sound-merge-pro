import { requireUser } from "../_lib/auth.js";

const configured = (name) => Boolean(process.env[name]);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireUser(req, res);
  if (!user) return;

  const providers = [
    {
      id: "gemini",
      label: "Gemini Prompt Architect",
      category: "ai",
      configured: configured("GEMINI_API_KEY"),
      mode: configured("GEMINI_API_KEY") ? "api" : "not_configured",
      real: configured("GEMINI_API_KEY"),
      note: configured("GEMINI_API_KEY") ? "Server-side prompt generation ready." : "Add GEMINI_API_KEY."
    },
    {
      id: "suno",
      label: "Suno",
      category: "music_generation",
      configured: configured("SUNO_API_KEY"),
      mode: configured("SUNO_API_KEY") && configured("SUNO_GENERATE_URL") ? "api" : configured("SUNO_API_KEY") ? "adapter_needed" : "not_configured",
      real: configured("SUNO_API_KEY") && configured("SUNO_GENERATE_URL"),
      note: configured("SUNO_API_KEY")
        ? (configured("SUNO_GENERATE_URL") ? "Official API credentials and generation endpoint configured." : "API key is present; set SUNO_GENERATE_URL / SUNO_STATUS_URL from the Suno Platform docs.")
        : "Connect the official Suno Platform API account."
    },
    {
      id: "mureka",
      label: "Mureka",
      category: "music_generation",
      configured: configured("MUREKA_API_KEY"),
      mode: configured("MUREKA_API_KEY") ? "api" : "not_configured",
      real: configured("MUREKA_API_KEY"),
      note: configured("MUREKA_API_KEY") ? "Official Mureka API ready." : "Add MUREKA_API_KEY."
    },
    {
      id: "udio",
      label: "Udio",
      category: "music_generation",
      configured: false,
      mode: "browser_agent",
      real: false,
      note: "Udio does not currently expose a public API. Keep this as a browser-agent/manual workflow."
    },
    {
      id: "rapidapi",
      label: "RapidAPI Signals",
      category: "data",
      configured: configured("RAPID_API_KEY"),
      mode: configured("RAPID_API_KEY") ? "api" : "not_configured",
      real: configured("RAPID_API_KEY"),
      note: configured("RAPID_API_KEY") ? "Server proxy ready." : "Add RAPID_API_KEY."
    },
    {
      id: "chartmetric",
      label: "Chartmetric",
      category: "data",
      configured: configured("CHARTMETRIC_REFRESH_TOKEN"),
      mode: configured("CHARTMETRIC_REFRESH_TOKEN") ? "server_proxy_needed" : "not_configured",
      real: false,
      note: configured("CHARTMETRIC_REFRESH_TOKEN")
        ? "Token exists but the current client-side implementation should be migrated behind a server proxy."
        : "Add CHARTMETRIC_REFRESH_TOKEN when ready."
    },
    {
      id: "kits",
      label: "Kits.AI",
      category: "audio",
      configured: configured("KITS_API_KEY"),
      mode: configured("KITS_API_KEY") ? "server_proxy_needed" : "not_configured",
      real: false,
      note: configured("KITS_API_KEY") ? "Credential detected; move conversions/separation behind server proxy." : "Add KITS_API_KEY."
    },
    {
      id: "kling",
      label: "Kling",
      category: "video",
      configured: configured("KLING_ACCESS_KEY") && configured("KLING_SECRET_KEY"),
      mode: configured("KLING_ACCESS_KEY") && configured("KLING_SECRET_KEY") ? "server_proxy_needed" : "not_configured",
      real: false,
      note: configured("KLING_ACCESS_KEY") && configured("KLING_SECRET_KEY") ? "Credentials detected; client-side simulation should be replaced by server-side adapter." : "Add Kling credentials server-side."
    },
    {
      id: "resemble",
      label: "Resemble",
      category: "voice",
      configured: configured("RESEMBLE_API_KEY"),
      mode: configured("RESEMBLE_API_KEY") ? "server_proxy_needed" : "not_configured",
      real: false,
      note: configured("RESEMBLE_API_KEY") ? "Credential detected; client-side calls should be moved behind server proxy." : "Add RESEMBLE_API_KEY."
    },
    {
      id: "alchemy",
      label: "Alchemy",
      category: "wallet_data",
      configured: configured("ALCHEMY_API_KEY"),
      mode: configured("ALCHEMY_API_KEY") ? "api" : "not_configured",
      real: configured("ALCHEMY_API_KEY"),
      note: configured("ALCHEMY_API_KEY") ? "Wallet/NFT/price data routes through the authenticated server proxy." : "Add ALCHEMY_API_KEY."
    },
    {
      id: "songtradr",
      label: "Songtradr Marketplace",
      category: "licensing",
      configured: false,
      mode: "retiring",
      real: false,
      note: "Artist Marketplace closes September 30, 2026. Direct-submit simulation has been disabled; preserve/export existing data and use current licensing channels."
    },
    {
      id: "system_webhook",
      label: "System Webhook",
      category: "automation",
      configured: configured("SYSTEM_BACKUP_WEBHOOK"),
      mode: configured("SYSTEM_BACKUP_WEBHOOK") ? "server_proxy_needed" : "not_configured",
      real: false,
      note: configured("SYSTEM_BACKUP_WEBHOOK") ? "Webhook configured; route from backend instead of exposing destination in client." : "Add SYSTEM_BACKUP_WEBHOOK."
    }
  ];

  res.status(200).json({
    checkedAt: new Date().toISOString(),
    providers
  });
}
