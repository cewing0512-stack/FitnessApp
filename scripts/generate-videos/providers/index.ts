import { DEFAULTS } from '../config';
import type { ImageProvider, VideoProvider } from './types';
import { createMockProvider } from './mock';
import { createVeoProvider } from './veo';

/**
 * Picks the provider named by VIDEO_PROVIDER in .env (default: veo).
 * To add another service, write a `createXProvider` like ./veo.ts and add a case here.
 */
export function getProvider(env: NodeJS.ProcessEnv): VideoProvider & Partial<ImageProvider> {
  const name = (env.VIDEO_PROVIDER || DEFAULTS.provider).toLowerCase();
  switch (name) {
    case 'veo': {
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY is missing. Add it to .env (see .env.example).');
      return createVeoProvider({
        apiKey,
        model: env.VEO_MODEL || DEFAULTS.veoModel,
        imageModel: env.IMAGE_MODEL || DEFAULTS.imageModel,
        personGeneration: env.VEO_PERSON_GENERATION || 'allow_adult',
        referenceMode: env.VEO_REFERENCE_MODE === 'first-frame' ? 'first-frame' : 'asset',
      });
    }
    case 'mock':
      return createMockProvider();
    default:
      throw new Error(`Unknown VIDEO_PROVIDER "${name}". Available: veo, mock. See scripts/generate-videos/providers/.`);
  }
}
