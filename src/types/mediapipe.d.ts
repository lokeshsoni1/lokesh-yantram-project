
// Type definitions for MediaPipe
declare interface HandsOptions {
  locateFile?: (file: string) => string;
}

declare interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

declare interface HandsResults {
  multiHandLandmarks: Array<Array<HandLandmark>>;
  multiHandedness: Array<{
    index: number;
    score: number;
    label: string;
  }>;
  image: HTMLVideoElement | HTMLImageElement;
}

declare interface Hands {
  new(options?: HandsOptions): Hands;
  setOptions(options: {
    maxNumHands?: number;
    modelComplexity?: number;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }): Promise<void>;
  onResults(callback: (results: HandsResults) => void): void;
  send(options: {image: HTMLVideoElement | HTMLImageElement}): Promise<void>;
  close(): void;
}

// Extend the Window interface to include MediaPipe objects globally
declare global {
  interface Window {
    Hands: {
      new(options?: HandsOptions): Hands;
    };
  }

  // Make these types available globally without imports
  const Hands: {
    new(options?: HandsOptions): Hands;
  };
  
  type HandLandmark = HandLandmark;
  type HandsResults = HandsResults;
}

export {};
