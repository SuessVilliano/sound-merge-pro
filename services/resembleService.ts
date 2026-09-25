

export interface DetectionResult {
    is_synthetic: boolean;
    score: number; // 0 to 1
    watermark_detected: boolean;
}

export const resembleService = {
    /**
     * Apply PerTh Neural Watermark to an existing audio file (Proxy call)
     */
    applyWatermark: async (_audioUrl: string): Promise<{ job_id: string, watermarked_url: string }> => {
        throw new Error('Resemble watermarking is not connected to the secure server adapter yet.');
    },

    /**
     * Detect synthetic artifacts and watermarks
     */
    detectDeepfake: async (_audioFile: File): Promise<DetectionResult> => {
        throw new Error('Resemble detection is not connected to the secure server adapter yet.');
    },

    /**
     * Standard Synthesis Flow
     */
    synthesize: async (_voiceUuid: string, _text: string): Promise<string> => {
        throw new Error('Resemble synthesis is not connected to the secure server adapter yet.');
    },

    createVoiceClone: async (_name: string): Promise<string> => {
        throw new Error('Resemble voice cloning is not connected to the secure server adapter yet.');
    }
};
