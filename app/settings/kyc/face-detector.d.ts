// The Shape Detection API's FaceDetector isn't in TypeScript's bundled DOM
// lib yet (Chromium-only, behind no flag as of recent versions; unsupported
// in Safari/Firefox). This describes just the surface LivenessCheck.tsx uses.
interface DetectedFace {
  boundingBox: DOMRectReadOnly;
}

interface FaceDetectorOptions {
  maxDetectedFaces?: number;
  fastMode?: boolean;
}

declare class FaceDetector {
  constructor(options?: FaceDetectorOptions);
  detect(
    image: CanvasImageSource | ImageBitmapSource
  ): Promise<DetectedFace[]>;
}

interface Window {
  FaceDetector?: typeof FaceDetector;
}
