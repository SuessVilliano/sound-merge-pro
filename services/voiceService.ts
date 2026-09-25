import { VoiceDetection, VoiceAsset } from "../types";

export const registerVoice = async (_file: File): Promise<{ success: boolean, nft?: VoiceAsset }> => {
  throw new Error('Voice registration is not connected to a verified fingerprinting + on-chain storage workflow yet.');
};

export const scanForClones = async (): Promise<VoiceDetection[]> => {
  return [];
};

export const issueTakedown = async (_detectionId: string): Promise<boolean> => {
  throw new Error('Automated takedown delivery is not connected. Sound Merge will not report a takedown as sent without a verified provider response.');
};
