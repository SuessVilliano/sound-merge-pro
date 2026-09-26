import { auth } from './firebase';
import { byokService } from './byokService';

export interface HiggsfieldVideoRequest {
  prompt: string;
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  resolution?: '720p' | '1080p';
  generateAudio?: boolean;
  modelPath?: string;
}

export interface HiggsfieldVideoJob {
  requestId: string;
  status: string;
  videoUrl?: string | null;
  audioUrl?: string | null;
  imageUrls?: string[];
  error?: string | null;
  credentialSource?: 'artist_byok' | 'sound_merge';
}

const headers = async () => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Sign in to use Higgsfield inside Sound Merge.');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...byokService.headers('higgsfield')
  };
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const higgsfieldApiService = {
  async submit(input: HiggsfieldVideoRequest): Promise<HiggsfieldVideoJob> {
    const response = await fetch('/api/video/higgsfield', {
      method: 'POST',
      headers: await headers(),
      body: JSON.stringify(input)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || 'Higgsfield generation failed.');
    return data;
  },

  async status(requestId: string): Promise<HiggsfieldVideoJob> {
    const response = await fetch(`/api/video/higgsfield?id=${encodeURIComponent(requestId)}`, {
      headers: await headers()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || 'Higgsfield status failed.');
    return data;
  },

  async generateAndWait(input: HiggsfieldVideoRequest, onUpdate?: (job: HiggsfieldVideoJob) => void): Promise<HiggsfieldVideoJob> {
    let job = await this.submit(input);
    if (!job.requestId) throw new Error('Higgsfield did not return a request ID.');
    onUpdate?.(job);

    for (let attempt = 0; attempt < 80; attempt++) {
      if (job.status === 'completed' && job.videoUrl) return job;
      if (['failed', 'nsfw', 'canceled'].includes(job.status)) {
        throw new Error(job.error || `Higgsfield request ended with status: ${job.status}`);
      }

      await sleep(Math.min(3000 + attempt * 250, 8000));
      job = await this.status(job.requestId);
      onUpdate?.(job);
    }

    throw new Error('Higgsfield generation is still processing. The request is saved and can be checked again later.');
  }
};
