import { auth } from './firebase';
import { MusicEngine } from './musicGenService';

export interface StudioPromptPack {
  title: string;
  stylePrompt: string;
  lyrics: string;
  negativePrompt: string;
  tags: string[];
  bpm: number;
  keyFeel: string;
  structure: string[];
  generationNotes: string;
}

const authHeaders = async () => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Sign in to use Prompt Architect.');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const studioPromptService = {
  async build(input: {
    brief?: string;
    currentStyle?: string;
    currentLyrics?: string;
    instrumental?: boolean;
    targetEngine?: MusicEngine;
  }): Promise<StudioPromptPack> {
    const response = await fetch('/api/ai/prompt-pack', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(input)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || 'Prompt Architect failed.');
    return data.pack as StudioPromptPack;
  }
};
