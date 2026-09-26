import { GeneratedTrack, generateFallbackAudioUrl } from './audioService';
import { auth } from './firebase';
import { byokService } from './byokService';

/**
 * Sound Merge music generation gateway.
 * External providers are called only through authenticated server routes so provider
 * credentials never ship to the browser.
 */
export type MusicEngine = 'suno' | 'mureka' | 'udio' | 'studio';

export interface ForgeOptions {
    engine: MusicEngine;
    prompt: string;
    lyrics?: string;
    isInstrumental?: boolean;
    styleTags?: string[];
    vocalGender?: 'male' | 'female' | 'none';
    version?: string;
    durationDesired?: number;
    title?: string;
}

interface ProviderJob {
    provider: string;
    taskType?: 'song' | 'instrumental' | string;
    taskId?: string | null;
    status?: string;
    model?: string | null;
    failedReason?: string | null;
    audioUrl?: string | null;
    imageUrl?: string | null;
    title?: string | null;
    duration?: number | string | null;
}

const getAuthHeaders = async (provider?: MusicEngine) => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Sign in to generate music.');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(provider === 'mureka' ? byokService.headers('mureka') : {}),
        ...(provider === 'suno' ? byokService.headers('suno') : {})
    };
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isComplete = (status?: string) => ['succeeded', 'completed', 'complete', 'ready'].includes((status || '').toLowerCase());
const isFailed = (status?: string) => ['failed', 'timeouted', 'cancelled', 'canceled', 'error'].includes((status || '').toLowerCase());

const formatDuration = (value: number | string | null | undefined, fallbackSeconds: number) => {
    if (typeof value === 'string' && value.includes(':')) return value;
    const seconds = typeof value === 'number'
        ? (value > 10000 ? Math.round(value / 1000) : Math.round(value))
        : fallbackSeconds;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const toTrack = (job: ProviderJob, options: ForgeOptions): GeneratedTrack => ({
    id: job.taskId || `${options.engine}_${Date.now()}`,
    title: job.title || options.title || options.prompt.substring(0, 40) || 'Generated Track',
    duration: formatDuration(job.duration, options.durationDesired || 60),
    status: 'completed',
    audioUrl: job.audioUrl || undefined,
    imageUrl: job.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(options.title || 'Sound Merge')}&background=0f172a&color=22d3ee&size=600`,
    tags: [options.engine, ...(options.styleTags || []).slice(0, 4)],
    type: 'song'
});

export const musicGenService = {
    async generate(options: ForgeOptions): Promise<GeneratedTrack> {
        const prompt = options.prompt?.trim();
        if (!prompt) throw new Error('A generation prompt is required.');

        if (options.engine === 'studio') {
            return this.generateLocalPreview(options);
        }

        if (options.engine === 'udio') {
            throw new Error('Udio does not currently expose a public API. Use a browser-agent workflow for Udio, or select Suno/Mureka for API generation.');
        }

        const headers = await getAuthHeaders(options.engine);
        const response = await fetch('/api/music/generate', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                provider: options.engine,
                prompt,
                lyrics: options.lyrics || '',
                instrumental: Boolean(options.isInstrumental),
                vocalGender: options.vocalGender === 'none' ? undefined : options.vocalGender,
                title: options.title || ''
            })
        });

        const initial = await response.json();
        if (!response.ok) throw new Error(initial?.error || `${options.engine} generation failed.`);

        if (initial.audioUrl && isComplete(initial.status)) {
            return toTrack(initial, options);
        }

        if (!initial.taskId) {
            if (initial.audioUrl) return toTrack({ ...initial, status: 'completed' }, options);
            throw new Error(`${options.engine} accepted the request but did not return a task ID.`);
        }

        return this.pollUntilComplete(initial as ProviderJob, options, headers);
    },

    async pollUntilComplete(initial: ProviderJob, options: ForgeOptions, headers: Record<string, string>): Promise<GeneratedTrack> {
        const maxAttempts = 90;
        let latest = initial;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (isComplete(latest.status) && latest.audioUrl) return toTrack(latest, options);
            if (isFailed(latest.status)) throw new Error(latest.failedReason || `${options.engine} generation failed.`);

            await sleep(4000);

            const params = new URLSearchParams({
                provider: options.engine,
                id: String(initial.taskId),
                taskType: initial.taskType || (options.isInstrumental ? 'instrumental' : 'song')
            });

            const response = await fetch(`/api/music/status?${params.toString()}`, { headers });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || `${options.engine} status check failed.`);
            latest = data as ProviderJob;
        }

        throw new Error(`${options.engine} generation timed out before a finished audio file was returned.`);
    },

    async generateLocalPreview(options: ForgeOptions): Promise<GeneratedTrack> {
        const duration = Math.max(10, Math.min(options.durationDesired || 30, 60));
        const audioUrl = generateFallbackAudioUrl(duration, options.isInstrumental ? 'beat' : 'song');
        return {
            id: `studio_preview_${Date.now()}`,
            title: options.title || options.prompt.substring(0, 30) || 'Studio Preview',
            duration: formatDuration(duration, duration),
            status: 'completed',
            audioUrl,
            imageUrl: 'https://ui-avatars.com/api/?name=Studio+Preview&background=0f172a&color=22d3ee&size=600',
            tags: ['Local Preview', ...(options.styleTags || []).slice(0, 4)],
            type: 'song'
        };
    }
};
