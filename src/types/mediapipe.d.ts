
// Type definitions for MediaPipe
interface HandsOptions {
  locateFile: (file: string) => string;
}

interface HandsResults {
  multiHandLandmarks: Array<Array<{x: number; y: number; z: number}>>;
  image: HTMLVideoElement | HTMLImageElement;
}

interface Hands {
  new(options?: HandsOptions): Hands;
  setOptions(options: {
    maxNumHands: number;
    modelComplexity: number;
    minDetectionConfidence: number;
    minTrackingConfidence: number;
  }): Promise<void>;
  onResults(callback: (results: HandsResults) => void): void;
  send(options: {image: HTMLVideoElement | HTMLImageElement}): void;
  close(): void;
}

// Extend the Window interface to include MediaPipe objects
declare global {
  interface Window {
    Hands?: Hands;
  }
}

export {};
