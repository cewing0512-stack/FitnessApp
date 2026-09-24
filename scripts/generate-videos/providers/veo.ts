import { GoogleGenAI, PersonGeneration, VideoGenerationReferenceType } from '@google/genai';
import type { ImageProvider, VideoProvider, VideoRequest } from './types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
      let op = await ai.models.generateVideos({
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
      });

      while (!op.done) {
        await sleep(pollMs);
        op = await ai.operations.getVideosOperation({ operation: op });
        req.log(`waiting… ${Math.round((Date.now() - started) / 1000)}s`);
      }
      if (op.error) throw new Error(`Veo error: ${JSON.stringify(op.error)}`);

      const video = op.response?.generatedVideos?.[0]?.video;
      if (!video) {
        const reasons = op.response?.raiMediaFilteredReasons?.join('; ');
        throw new Error(`Veo returned no video${reasons ? ` (safety filter: ${reasons})` : ''}. Try again or adjust the prompt.`);
      }
      await ai.files.download({ file: video, downloadPath: req.outPath });
    },

    async generateImages(prompt: string, count: number) {
      const res = await ai.models.generateImages({
        model: opts.imageModel,
        prompt,
        config: { numberOfImages: count, aspectRatio: '9:16', personGeneration: PersonGeneration.ALLOW_ADULT },
      });
      return (res.generatedImages ?? [])
        .map((g) => g.image)
        .filter((img): img is NonNullable<typeof img> => !!img?.imageBytes)
        .map((img) => ({ bytes: Buffer.from(img.imageBytes!, 'base64'), mimeType: img.mimeType ?? 'image/png' }));
    },
  };
}
