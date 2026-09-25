/**
 * A video generation service. To add one (Runway, Kling, Luma, …), implement
 * this interface in a new file and register it in ./index.ts.
 */
export interface VideoProvider {
  name: string;
  /** Whether a character reference image is used to keep the person consistent. */
  supportsReferenceImage: boolean;
  generate(req: VideoRequest): Promise<void>;
}

export interface VideoRequest {
  id: string;
  prompt: string;
  negativePrompt: string;
  /** Always '9:16' for this app. */
  aspectRatio: '9:16';
  durationSec: number;
  /** Photo of the character, if one exists. */
  referenceImage?: { bytes: Buffer; mimeType: string };
  /** Where to write the downloaded (uncompressed) video file. */
  outPath: string;
  log: (msg: string) => void;
}

export interface ImageProvider {
  /** Generates `count` still images and returns their bytes (PNG/JPEG). */
  generateImages(prompt: string, count: number): Promise<{ bytes: Buffer; mimeType: string }[]>;
  /** Redraws a reference photo according to the prompt (same person, new pose). */
  editImage(reference: { bytes: Buffer; mimeType: string }, prompt: string): Promise<{ bytes: Buffer; mimeType: string }>;
}
