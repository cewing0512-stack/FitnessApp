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
      // A spent daily quota won't come back within a few retries.
      const dailyQuota = /exceeded your current quota/i.test(msg);
      if (!temporary || dailyQuota || i >= attempts) throw e;
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
  /**
   * How the character photo is used: 'asset' sends it as a reference image;
   * 'first-frame' starts the clip from the image it is given (image-to-video). With
   * start frames, that image is the character already in the exercise's start position.
   */
  referenceMode: 'asset' | 'first-frame';
  pollMs?: number;
}

/** Google Veo via the Gemini API (@google/genai). */
export function createVeoProvider(opts: VeoOptions): VideoProvider & ImageProvider {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey });
  const pollMs = opts.pollMs ?? 10_000;
  let audioFlagSupported = true;

  return {
    name: 'veo',
    supportsReferenceImage: true,

    async generate(req: VideoRequest) {
      const started = Date.now();
      // Veo rejects a separate negative prompt when a reference image is attached, and
      // appending the avoid-list to the text trips its audio filter, so it's only sent
      // without a reference image. The prompt itself already rules out text, music and logos.
      const prompt = req.prompt;
      // Clips play muted, so ask for no audio (fewer audio-related failures). If this
      // model doesn't accept the flag, fall back to the default once.
      const ref = req.referenceImage
        ? { imageBytes: req.referenceImage.bytes.toString('base64'), mimeType: req.referenceImage.mimeType }
        : undefined;
      const asAsset = ref && opts.referenceMode === 'asset';
      const request = (audioFlag: boolean) =>
        ai.models.generateVideos({
          model: opts.model,
          source: ref && !asAsset ? { prompt, image: ref } : { prompt },
          config: {
            aspectRatio: req.aspectRatio,
            durationSeconds: req.durationSec,
            personGeneration: opts.personGeneration,
            numberOfVideos: 1,
            ...(audioFlag ? { generateAudio: false } : {}),
            ...(asAsset
              ? { referenceImages: [{ image: ref, referenceType: VideoGenerationReferenceType.ASSET }] }
              : { negativePrompt: req.negativePrompt }),
          },
        });
      let op = await withRetry(async () => {
        if (!audioFlagSupported) return request(false);
        try {
          return await request(true);
        } catch (e) {
          if (!/generate_?audio|generateAudio/i.test(String(e))) throw e;
          audioFlagSupported = false;
          req.log('model does not accept generateAudio=false; using its default');
          return request(false);
        }
      }, req.log);

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

    async editImage(reference, prompt) {
      const res = await withRetry(() =>
        ai.models.generateContent({
          model: opts.imageModel,
          contents: [
            { inlineData: { data: reference.bytes.toString('base64'), mimeType: reference.mimeType } },
            { text: prompt },
          ],
          config: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '9:16' } },
        }),
      );
      for (const part of res.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          return { bytes: Buffer.from(part.inlineData.data, 'base64'), mimeType: part.inlineData.mimeType ?? 'image/png' };
        }
      }
      throw new Error('The image model returned no image for the start frame.');
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
