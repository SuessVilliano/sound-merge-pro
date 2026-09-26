import { requireUser } from "../_lib/auth.js";

const configured = (name) => Boolean(process.env[name]);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireUser(req, res);
  if (!user) return;

  const providers = [
    {
      id: "nano_banana",
      label: "Nano Banana 2 Artwork",
      category: "image",
      configured: configured("GEMINI_API_KEY"),
      mode: configured("GEMINI_API_KEY") ? "api" : "not_configured",
      real: configured("GEMINI_API_KEY"),
      note: configured("GEMINI_API_KEY")
        ? "Gemini 3.1 Flash Image powers in-app release artwork generation and reference-image editing."
        : "Add GEMINI_API_KEY to enable Nano Banana 2 artwork generation."
    },
    {
      id: "sound_merge_mcp",
      label: "Sound Merge MCP",
      category: "automation",
      configured: configured("SOUND_MERGE_MCP_KEY"),
      mode: configured("SOUND_MERGE_MCP_KEY") ? "mcp" : "not_configured",
      real: configured("SOUND_MERGE_MCP_KEY"),
      note: configured("SOUND_MERGE_MCP_KEY")
        ? "Remote MCP endpoint is ready at /api/mcp for ChatGPT, Grokbot, Cursor, Claude and other MCP clients."
        : "Set SOUND_MERGE_MCP_KEY to enable stable remote-agent access."
    },
    {
      id: "higgsfield",
      label: "Higgsfield",
      category: "video",
      configured: configured("HIGGSFIELD_API_KEY_ID") && configured("HIGGSFIELD_API_KEY_SECRET"),
      mode: configured("HIGGSFIELD_API_KEY_ID") && configured("HIGGSFIELD_API_KEY_SECRET") ? "api" : "browser_agent",
      real: configured("HIGGSFIELD_API_KEY_ID") && configured("HIGGSFIELD_API_KEY_SECRET"),
      note: configured("HIGGSFIELD_API_KEY_ID") && configured("HIGGSFIELD_API_KEY_SECRET")
        ? "Higgsfield API credentials are present for embedded generation. Official MCP and Web routes remain available too."
        : "Use Higgsfield Web or official MCP now; add API credentials when you want generation embedded directly in Sound Merge."
    },
    {
      id: "labelgrid",
      label: "LabelGrid Distribution",
      category: "distribution",
      configured: configured("LABELGRID_API_TOKEN"),
      mode: configured("LABELGRID_API_TOKEN") ? "api" : "not_configured",
      real: configured("LABELGRID_API_TOKEN"),
      note: configured("LABELGRID_API_TOKEN")
        ? "Real distribution, delivery status, analytics, statements and royalty endpoints are available through the secure server gateway."
        : "Add a LabelGrid API token to activate the full white-label distribution and royalty rail. LabelGrid also has an official MCP server."
    },
    {
      id: "music_ai",
      label: "Music.AI",
      category: "audio",
      configured: configured("MUSIC_AI_API_KEY"),
      mode: configured("MUSIC_AI_API_KEY") ? "server_proxy_needed" : "not_configured",
      real: false,
      note: configured("MUSIC_AI_API_KEY")
        ? "Credential detected. Build the secure workflow adapter for stems, transcription, voice detection and audio intelligence."
        : "Music.AI is the preferred future stem/audio-intelligence rail."
    },
    {
      id: "landr",
      label: "LANDR Mastering",
      category: "audio",
      configured: configured("LANDR_API_KEY"),
      mode: configured("LANDR_API_KEY") ? "server_proxy_needed" : "not_configured",
      real: false,
      note: configured("LANDR_API_KEY")
        ? "Credential detected. Connect the mastering API to the Mastering Console."
        : "LANDR is the preferred commercial mastering API rail when access is enabled."
    },
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
      mode: configured("CHARTMETRIC_REFRESH_TOKEN") ? "api" : "not_configured",
      real: configured("CHARTMETRIC_REFRESH_TOKEN"),
      note: configured("CHARTMETRIC_REFRESH_TOKEN")
        ? "Artist search and Spotify audience analytics route through the authenticated server proxy."
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
      id: "solana_mint",
      label: "Solana Minting",
      category: "rights",
      configured: false,
      mode: "adapter_needed",
      real: false,
      note: "Wallet connection and transaction verification can be real; minting stays disabled until metadata storage + Metaplex execution are verified."
    },
    {
      id: "lighthouse",
      label: "Lighthouse / IPFS",
      category: "storage",
      configured: configured("LIGHTHOUSE_API_KEY"),
      mode: configured("LIGHTHOUSE_API_KEY") ? "server_proxy_needed" : "not_configured",
      real: false,
      note: configured("LIGHTHOUSE_API_KEY") ? "Credential exists; secure upload adapter still needs to be implemented." : "Add LIGHTHOUSE_API_KEY when building the secure storage adapter."
    },
    {
      id: "google_calendar",
      label: "Google Calendar",
      category: "calendar",
      configured: false,
      mode: "adapter_needed",
      real: false,
      note: "Old simulated OAuth/events were removed. A real OAuth/calendar adapter still needs to be connected."
    },
    {
      id: "crm",
      label: "CRM / GHL Gateway",
      category: "crm",
      configured: false,
      mode: "adapter_needed",
      real: false,
      note: "Fallback contacts, threads and fake send success were removed. The gateway must return real authenticated data before this can be marked connected."
    },
    {
      id: "royalty_recovery",
      label: "Royalty Recovery",
      category: "royalties",
      configured: false,
      mode: "adapter_needed",
      real: false,
      note: "Demo recovery dollars were removed. Connect PRO/CMO, mechanical, neighboring-rights, distributor or publishing sources before reporting recovery totals."
    },
    {
      id: "system_webhook",
      label: "System Webhook",
      category: "automation",
      configured: configured("SYSTEM_BACKUP_WEBHOOK"),
      mode: configured("SYSTEM_BACKUP_WEBHOOK") ? "api" : "not_configured",
      real: configured("SYSTEM_BACKUP_WEBHOOK"),
      note: configured("SYSTEM_BACKUP_WEBHOOK") ? "Authenticated server relay is active; destination is no longer exposed to the client." : "Add SYSTEM_BACKUP_WEBHOOK."
    }
  ];

  res.status(200).json({
    checkedAt: new Date().toISOString(),
    providers
  });
}
