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
  /** Photo of the character, sent as a style reference (--use-reference). */
  referenceImage?: Image;
  /** Still of her in the exercise's starting position, used as the video's first frame. */
  startFrame?: Image;
  /** Where to write the downloaded (uncompressed) video file. */
  outPath: string;
  log: (msg: string) => void;
}

export interface Image {
  bytes: Buffer;
  mimeType: string;
}

export interface ImageProvider {
  /**
   * Generates `count` still images and returns their bytes (PNG/JPEG).
   * `reference` is a photo of the character to keep her looking the same.
   */
  generateImages(prompt: string, count: number, reference?: Image): Promise<Image[]>;
}
