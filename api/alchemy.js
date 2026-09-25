import { requireUser } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireUser(req, res);
  if (!user) return;

  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Alchemy is not configured" });

  const { action, address = "", symbols = "" } = req.query || {};

  try {
    if (action === "prices") {
      const list = String(symbols).split(",").map(s => s.trim()).filter(Boolean);
      if (!list.length) return res.status(400).json({ error: "symbols required" });
      const query = list.map(s => `symbols=${encodeURIComponent(s)}`).join("&");
      const response = await fetch(`https://api.g.alchemy.com/prices/v1/${apiKey}/tokens/by-symbol?${query}`);
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json({ error: data?.message || "Alchemy price request failed" });
      return res.status(200).json(data);
    }

    if (!address) return res.status(400).json({ error: "address required" });

    if (action === "solana-nfts" || action === "solana-tokens") {
      const response = await fetch(`https://solana-mainnet.g.alchemy.com/v2/${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "solana-nfts" ? {
          jsonrpc: "2.0",
          id: "sound-merge-nfts",
          method: "getAssetsByOwner",
          params: {
            ownerAddress: address,
            page: 1,
            limit: 50,
            displayOptions: { showCollectionMetadata: true, showUnverifiedCollections: true }
          }
        } : {
          jsonrpc: "2.0",
          id: "sound-merge-tokens",
          method: "getTokenAccountsByOwner",
          params: [
            address,
            { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
            { encoding: "jsonParsed" }
          ]
        })
      });
      const data = await response.json();
      if (data?.error) return res.status(502).json({ error: data.error?.message || "Alchemy RPC error" });
      return res.status(200).json(data);
    }

    if (action === "polygon-assets") {
      const response = await fetch(`https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "sound-merge-polygon-assets",
          method: "alchemy_getTokenBalances",
          params: [address]
        })
      });
      const data = await response.json();
      if (data?.error) return res.status(502).json({ error: data.error?.message || "Alchemy RPC error" });
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: "Invalid Alchemy action" });
  } catch (error) {
    console.error("[AlchemyProxy]", error);
    return res.status(502).json({ error: "Alchemy provider unavailable" });
  }
}
