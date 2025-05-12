// src/components/HandTracking.tsx
'use client';

import { useEffect } from 'react';

declare var Hands: any;
declare var Camera: any;

export default function HandTracking() {
  useEffect(() => {
    const hands = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    });

    const videoElement = document.querySelector('video');

    if (videoElement) {
      const camera = new Camera(videoElement, {
        onFrame: async () => {
          await hands.send({ image: videoElement });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }

    const themeToggleButton = document.getElementById('theme-toggle');
    themeToggleButton?.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
    });
  }, []);

  return null;
}
