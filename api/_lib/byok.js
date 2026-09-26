const header = (req, name) => {
  const value = req?.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

export const getByokKey = (req) => String(header(req, "x-sm-byok-key") || "").trim();

export const getHiggsfieldByok = (req) => ({
  keyId: String(header(req, "x-sm-byok-key-id") || "").trim(),
  keySecret: String(header(req, "x-sm-byok-key-secret") || "").trim()
});

export const getSunoByokUrls = (req) => ({
  generateUrl: safeProviderUrl(header(req, "x-sm-byok-generate-url"), ["suno.com"]),
  statusUrl: safeProviderUrl(header(req, "x-sm-byok-status-url"), ["suno.com"])
});

export const safeProviderUrl = (raw, allowedHosts = []) => {
  if (!raw) return "";
  try {
    const url = new URL(String(raw));
    if (url.protocol !== "https:") return "";
    if (allowedHosts.length && !allowedHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
};

export const credentialSource = (byokValue, platformValue) =>
  byokValue ? "artist_byok" : platformValue ? "sound_merge" : "missing";
