import { auth } from './firebase';

export interface AlchemyNFT {
  id: string;
  content: {
    json_uri: string;
    files: { uri: string, mime: string }[];
    metadata: { name: string; description: string; symbol: string };
    links: { image: string; external_url: string };
  };
  compression: { compressed: boolean };
  grouping: { group_key: string; group_value: string }[];
  creators: { address: string; share: number; verified: boolean }[];
}

export interface TokenPrice {
  symbol: string;
  price: number;
  percent_change_24h: number;
  logo?: string;
}

const get = async (params: Record<string, string>) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Sign in to use wallet data.');

  const qs = new URLSearchParams(params);
  const response = await fetch(`/api/alchemy?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || 'Alchemy request failed.');
  return data;
};

export const alchemyService = {
  async getNftsByOwner(walletAddress: string): Promise<AlchemyNFT[]> {
    if (!walletAddress) return [];
    try {
      const data = await get({ action: 'solana-nfts', address: walletAddress });
      return data?.result?.items || [];
    } catch (e) {
      console.warn('[Alchemy] NFT fetch unavailable:', e);
      return [];
    }
  },

  async getTokenBalances(walletAddress: string) {
    if (!walletAddress) return [];
    try {
      const data = await get({ action: 'solana-tokens', address: walletAddress });
      return data?.result?.value || [];
    } catch (e) {
      console.warn('[Alchemy] token balances unavailable:', e);
      return [];
    }
  },

  getStoredWebhookUrl(): string {
    return localStorage.getItem('sf_alchemy_webhook_url') || '';
  },

  setStoredWebhookUrl(url: string) {
    localStorage.setItem('sf_alchemy_webhook_url', url);
  },

  async createWebhook(_webhookUrl: string, _addresses: string[]) {
    throw new Error('Alchemy Notify webhook creation is not connected to the secure server adapter yet.');
  },

  async getTokenPrices(symbols: string[]): Promise<TokenPrice[]> {
    if (!symbols.length) return [];
    try {
      const data = await get({ action: 'prices', symbols: symbols.join(',') });
      return (data?.data || []).map((item: any) => {
        const priceData = item?.prices?.[0];
        return {
          symbol: item.symbol,
          price: priceData ? Number(priceData.value || 0) : 0,
          percent_change_24h: priceData ? Number(priceData.last_24h_change || 0) * 100 : 0,
          logo: item.logo
        };
      });
    } catch (e) {
      console.warn('[Alchemy] price data unavailable:', e);
      return [];
    }
  },

  async createSmartWallet(_ownerAddress: string): Promise<{ address: string, network: string, gasPolicyId: string }> {
    throw new Error('Smart-wallet creation is not connected yet. Sound Merge will not fabricate a wallet address.');
  },

  async getSmartWalletAssets(address: string) {
    if (!address) return [];
    try {
      const data = await get({ action: 'polygon-assets', address });
      return data?.result?.tokenBalances || [];
    } catch (e) {
      console.warn('[Alchemy] smart-wallet assets unavailable:', e);
      return [];
    }
  }
};
