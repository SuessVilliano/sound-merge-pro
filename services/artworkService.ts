import { auth } from './firebase';

export const artworkService = {
  async generate(input: {
    prompt: string;
    title?: string;
    artistName?: string;
    aspectRatio?: '1:1' | '4:5' | '16:9';
    imageSize?: '1K' | '2K' | '4K';
    referenceImages?: string[];
  }): Promise<{ model: string; mimeType: string; dataUrl: string }> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Sign in to generate artwork.');

    const response = await fetch('/api/ai/artwork', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || 'Artwork generation failed.');
    return data;
  }
};
