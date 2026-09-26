export type ByokProvider = 'gemini' | 'mureka' | 'suno' | 'elevenlabs' | 'higgsfield';

export type ByokCredentials = {
  apiKey?: string;
  keyId?: string;
  keySecret?: string;
  generateUrl?: string;
  statusUrl?: string;
};

const prefix = 'sm_byok_v1_';

const getStore = () => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
};

const sanitize = (value?: string) => String(value || '').trim();

export const byokService = {
  get(provider: ByokProvider): ByokCredentials | null {
    try {
      const raw = getStore()?.getItem(prefix + provider);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        apiKey: sanitize(parsed.apiKey),
        keyId: sanitize(parsed.keyId),
        keySecret: sanitize(parsed.keySecret),
        generateUrl: sanitize(parsed.generateUrl),
        statusUrl: sanitize(parsed.statusUrl)
      };
    } catch {
      return null;
    }
  },

  save(provider: ByokProvider, credentials: ByokCredentials) {
    const clean: ByokCredentials = {
      apiKey: sanitize(credentials.apiKey),
      keyId: sanitize(credentials.keyId),
      keySecret: sanitize(credentials.keySecret),
      generateUrl: sanitize(credentials.generateUrl),
      statusUrl: sanitize(credentials.statusUrl)
    };
    getStore()?.setItem(prefix + provider, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent('sm-byok-updated', { detail: { provider } }));
  },

  clear(provider: ByokProvider) {
    getStore()?.removeItem(prefix + provider);
    window.dispatchEvent(new CustomEvent('sm-byok-updated', { detail: { provider } }));
  },

  has(provider: ByokProvider) {
    const value = this.get(provider);
    if (!value) return false;
    if (provider === 'higgsfield') return Boolean(value.keyId && value.keySecret);
    return Boolean(value.apiKey);
  },

  headers(provider: ByokProvider): Record<string, string> {
    const value = this.get(provider);
    if (!value) return {};

    const headers: Record<string, string> = {};
    if (value.apiKey) headers['X-SM-BYOK-Key'] = value.apiKey;
    if (value.keyId) headers['X-SM-BYOK-Key-Id'] = value.keyId;
    if (value.keySecret) headers['X-SM-BYOK-Key-Secret'] = value.keySecret;
    if (value.generateUrl) headers['X-SM-BYOK-Generate-Url'] = value.generateUrl;
    if (value.statusUrl) headers['X-SM-BYOK-Status-Url'] = value.statusUrl;
    return headers;
  },

  masked(provider: ByokProvider) {
    const value = this.get(provider);
    const raw = provider === 'higgsfield' ? value?.keyId : value?.apiKey;
    if (!raw) return '';
    return raw.length <= 8 ? '••••••••' : `${raw.slice(0, 4)}••••${raw.slice(-4)}`;
  }
};
