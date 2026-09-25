import { VideoGenerationJob, Track } from '../types';

export type KlingMode = 'text_to_video' | 'image_to_video' | 'lip_sync' | 'extension' | 'avatar';

export interface KlingConfig {
  mode: KlingMode;
  prompt: string;
  negative_prompt?: string;
  image_url?: string;
  audio_url?: string;
  motion_score?: number;
  camera_control?: {
    pan?: number;
    tilt?: number;
    zoom?: number;
    roll?: number;
  };
  duration?: 5 | 10;
  aspect_ratio?: '16:9' | '9:16';
}

export const klingService = {
  async forgeVideo(_track: Track, _config: KlingConfig): Promise<VideoGenerationJob> {
    throw new Error(
      'Kling Cinema Forge is not connected to a verified server-side API adapter yet. Sound Merge will not charge credits or return a stock video as if it were a real render.'
    );
  },

  getNextProgress(current: number, _mode: KlingMode): { progress: number; message: string } {
    return { progress: current, message: 'Waiting for a verified video provider adapter.' };
  },

  async getDownloadUrl(_jobId: string): Promise<string> {
    throw new Error('No verified Kling render exists for this job.');
  }
};
