import { Connection, PublicKey } from '@solana/web3.js';

declare global {
  interface Window {
    solana: any;
  }
}

const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

export type MintType = 'music' | 'voice' | 'license';

export interface MintMetadata {
  title: string;
  description?: string;
  artist: string;
  image?: string;
  attributes: { trait_type: string; value: string | number }[];
  external_url?: string;
}

export const solanaService = {
  async checkWalletConnection(): Promise<PublicKey | null> {
    if (window.solana?.isPhantom) {
      try {
        const resp = await window.solana.connect({ onlyIfTrusted: true });
        return resp.publicKey;
      } catch {
        return null;
      }
    }
    return null;
  },

  async connectWallet(): Promise<string | null> {
    if (!window.solana?.isPhantom) {
      window.open('https://phantom.app/', '_blank');
      throw new Error('Phantom wallet not found.');
    }
    try {
      const resp = await window.solana.connect();
      return resp.publicKey.toString();
    } catch (error) {
      console.error('Wallet connection rejected', error);
      throw new Error('Wallet connection rejected.');
    }
  },

  createPaymentRequest(recipient: string, amount: number, label: string, message: string, token: 'SOL' | 'USDC' = 'SOL') {
    const recipientPubkey = new PublicKey(recipient);
    const encodedLabel = encodeURIComponent(label);
    const encodedMessage = encodeURIComponent(message);
    let url = `solana:${recipientPubkey}?amount=${amount.toFixed(6)}&label=${encodedLabel}&message=${encodedMessage}`;
    if (token === 'USDC') {
      const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      url += `&spl-token=${usdcMint}`;
    }
    return url;
  },

  async verifyTransaction(signature: string): Promise<boolean> {
    try {
      const status = await connection.getSignatureStatus(signature);
      return status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized';
    } catch (error) {
      console.error('[Solana] Verification unavailable:', error);
      return false;
    }
  },

  async mintAsset(
    _type: MintType,
    _metadata: MintMetadata,
    onStatusChange?: (status: string) => void
  ) {
    if (!window.solana?.isConnected) throw new Error('Wallet not connected.');
    onStatusChange?.('Mint provider not connected.');
    throw new Error('On-chain minting is not connected to a verified metadata-storage + Metaplex transaction flow yet. Sound Merge will not fabricate a mint address or transaction signature.');
  }
};
