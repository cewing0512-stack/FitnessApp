import { GoogleGenAI, VideoGenerationReferenceType } from '@google/genai';
import type { ImageProvider, VideoProvider, VideoRequest } from './types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retries temporary API errors (rate limit, overload) with exponential backoff. */
async function withRetry<T>(fn: () => Promise<T>, log: (m: string) => void = console.log, attempts = 5): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const temporary = /\b(429|500|502|503|504)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|ECONNRESET|fetch failed/i.test(msg);
      if (!temporary || i >= attempts) throw e;
      const wait = Math.min(60, 5 * 2 ** (i - 1));
      log(`temporary error (${msg.slice(0, 80)}…), retrying in ${wait}s [${i}/${attempts - 1}]`);
      await sleep(wait * 1000);
    }
  }
}

interface VeoOptions {
  apiKey: string;
  model: string;
  imageModel: string;
  /** 'allow_adult' is required to generate people. */
  personGeneration: string;
  pollMs?: number;
}

/** Google Veo via the Gemini API (@google/genai). */
export function createVeoProvider(opts: VeoOptions): VideoProvider & ImageProvider {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey });
  const pollMs = opts.pollMs ?? 10_000;

  return {
    name: 'veo',
    supportsReferenceImage: true,

    async generate(req: VideoRequest) {
      const started = Date.now();
      let op = await withRetry(() => ai.models.generateVideos({
        model: opts.model,
        prompt: req.prompt,
        config: {
          aspectRatio: req.aspectRatio,
          durationSeconds: req.durationSec,
          negativePrompt: req.negativePrompt,
          personGeneration: opts.personGeneration,
          numberOfVideos: 1,
          ...(req.referenceImage
            ? {
                referenceImages: [
                  {
                    image: { imageBytes: req.referenceImage.bytes.toString('base64'), mimeType: req.referenceImage.mimeType },
                    referenceType: VideoGenerationReferenceType.ASSET,
                  },
                ],
              }
            : {}),
        },
      }), req.log);

      while (!op.done) {
        await sleep(pollMs);
        const current = op;
        op = await withRetry(() => ai.operations.getVideosOperation({ operation: current }), req.log);
        req.log(`waiting… ${Math.round((Date.now() - started) / 1000)}s`);
      }
      if (op.error) throw new Error(`Veo error: ${JSON.stringify(op.error)}`);

      const video = op.response?.generatedVideos?.[0]?.video;
      if (!video) {
        const reasons = op.response?.raiMediaFilteredReasons?.join('; ');
        throw new Error(`Veo returned no video${reasons ? ` (safety filter: ${reasons})` : ''}. Try again or adjust the prompt.`);
      }
      await withRetry(() => ai.files.download({ file: video, downloadPath: req.outPath }), req.log);
    },

    async generateImages(prompt: string, count: number) {
      // Gemini image models return one image per call, so request them one at a time.
      const images: { bytes: Buffer; mimeType: string }[] = [];
      for (let i = 0; i < count; i++) {
        const res = await withRetry(() =>
          ai.models.generateContent({
            model: opts.imageModel,
            contents: prompt,
            config: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '9:16' } },
          }),
        );
        for (const part of res.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData?.data) {
            images.push({ bytes: Buffer.from(part.inlineData.data, 'base64'), mimeType: part.inlineData.mimeType ?? 'image/png' });
            break;
          }
        }
      }
      if (!images.length) throw new Error('The image model returned no images. Try again or adjust the character description.');
      return images;
    },
  };
}
