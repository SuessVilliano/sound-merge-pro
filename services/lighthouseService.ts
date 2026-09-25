export interface LighthouseUploadResponse {
  Name: string;
  Hash: string;
  Size: string;
}

export const lighthouseService = {
  async uploadPublic(_file: File): Promise<LighthouseUploadResponse> {
    throw new Error('Lighthouse/IPFS upload is not connected to a secure server-side adapter yet.');
  },

  async uploadEncrypted(_file: File, _walletAddress: string, _signedMessage: string): Promise<LighthouseUploadResponse> {
    throw new Error('Encrypted Lighthouse upload is not connected to a secure server-side adapter yet.');
  },

  async createAssetBundle(_files: File[]): Promise<File> {
    throw new Error('Asset bundle creation is not connected to a real ZIP pipeline yet.');
  },

  getGatewayUrl(cid: string) {
    return `https://gateway.lighthouse.storage/ipfs/${cid}`;
  }
};
