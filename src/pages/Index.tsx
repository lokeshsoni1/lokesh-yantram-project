
import React, { useEffect, useRef, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [handState, setHandState] = useState<string>('detecting');
  const [bulbPower, setBulbPower] = useState<string>('off');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMediaPipeLoaded, setIsMediaPipeLoaded] = useState<boolean>(false);
  const handsRef = useRef<any>(null);
  const contactLinksRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Initialize MediaPipe and webcam
  useEffect(() => {
    const loadMediaPipe = async () => {
      try {
        // Load the MediaPipe Hands module dynamically
        const { Hands } = await import('@mediapipe/hands');
        
        // Create a new Hands instance
        handsRef.current = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        // Configure the Hands instance
        await handsRef.current.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        // Set up the callback function for results
        handsRef.current.onResults(onResults);
        
        // Mark MediaPipe as loaded
        setIsMediaPipeLoaded(true);
      } catch (error) {
        console.error('Failed to load MediaPipe Hands:', error);
        toast.toast({
          title: "MediaPipe Load Error",
          description: "Failed to load hand detection module",
          variant: "destructive"
        });
      }
    };
    
    loadMediaPipe();
    
    return () => {
      // Clean up MediaPipe resources
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, []);

  // Initialize webcam once MediaPipe is loaded
  useEffect(() => {
    if (!isMediaPipeLoaded) return;
    
    const initializeWebcam = async () => {
      try {
        if (!videoRef.current) return;
        
        const constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsLoading(false);
          toast.toast({
            title: "Camera Ready",
            description: "Wave your hand in front of the camera",
          });
          
          // Start processing frames
          sendFramesToMediaPipe();
        };
      } catch (error) {
        console.error('Error accessing webcam:', error);
        setHandState('error');
        toast.toast({
          title: "Camera Access Error",
          description: "Please allow camera access to use this app",
          variant: "destructive"
        });
      }
    };
    
    initializeWebcam();
  }, [isMediaPipeLoaded]);

  // Animate contact links on page load
  useEffect(() => {
    if (!contactLinksRef.current) return;
    
    const links = contactLinksRef.current.querySelectorAll('.contact-link');
    
    links.forEach((link, index) => {
      setTimeout(() => {
        link.classList.add('animated');
      }, 500 + index * 200);
    });
  }, []);

  const sendFramesToMediaPipe = async () => {
    if (!videoRef.current || !handsRef.current || !canvasRef.current) {
      return;
    }

    const videoElement = videoRef.current;
    
    // Make sure the video is playing
    if (videoElement.paused || videoElement.ended) {
      return;
    }

    // Process the current frame
    await handsRef.current.send({image: videoElement});
    
    // Request the next frame
    requestAnimationFrame(sendFramesToMediaPipe);
  };

  // Process hand detection results
  const onResults = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Check if hands are detected
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Get landmarks for the first hand
      const landmarks = results.multiHandLandmarks[0];
      
      // Draw hand landmarks
      drawHandLandmarks(ctx, landmarks, canvas.width, canvas.height);
      
      // Calculate hand state (open fingers)
      const openFingers = countOpenFingers(landmarks);
      
      // Update hand state and bulb power
      if (openFingers >= 4) {
        setHandState('open');
        setBulbPower('full');
      } else if (openFingers >= 2) {
        setHandState('half-open');
        setBulbPower('half');
      } else {
        setHandState('closed');
        setBulbPower('off');
      }
    } else {
      setHandState('detecting');
      setBulbPower('off');
    }
  };

  // Draw hand landmarks on canvas
  const drawHandLandmarks = (
    ctx: CanvasRenderingContext2D, 
    landmarks: any[], 
    width: number, 
    height: number
  ) => {
    // Draw connections between landmarks
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#4ade80';
    
    // Define connections between landmarks
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // index finger
      [0, 9], [9, 10], [10, 11], [11, 12], // middle finger
      [0, 13], [13, 14], [14, 15], [15, 16], // ring finger
      [0, 17], [17, 18], [18, 19], [19, 20], // pinky
      [0, 5], [5, 9], [9, 13], [13, 17] // palm
    ];
    
    // Draw connections
    for (const [startIdx, endIdx] of connections) {
      const startPoint = landmarks[startIdx];
      const endPoint = landmarks[endIdx];
      
      ctx.beginPath();
      ctx.moveTo(startPoint.x * width, startPoint.y * height);
      ctx.lineTo(endPoint.x * width, endPoint.y * height);
      ctx.stroke();
    }
    
    // Draw landmarks
    ctx.fillStyle = '#60a5fa';
    landmarks.forEach(landmark => {
      ctx.beginPath();
      ctx.arc(
        landmark.x * width, 
        landmark.y * height, 
        3, 0, 2 * Math.PI
      );
      ctx.fill();
    });
  };

  // Count open fingers based on hand landmarks
  const countOpenFingers = (landmarks: any[]): number => {
    if (!landmarks) return 0;
    
    let openFingers = 0;
    
    // Check if thumb is extended
    const thumbIsOpen = 
      landmarks[4].x < landmarks[3].x && 
      landmarks[3].x < landmarks[2].x && 
      landmarks[2].x < landmarks[1].x;
    
    if (thumbIsOpen) openFingers++;
    
    // Check if index finger is extended
    if (landmarks[8].y < landmarks[6].y) openFingers++;
    
    // Check if middle finger is extended
    if (landmarks[12].y < landmarks[10].y) openFingers++;
    
    // Check if ring finger is extended
    if (landmarks[16].y < landmarks[14].y) openFingers++;
    
    // Check if pinky is extended
    if (landmarks[20].y < landmarks[18].y) openFingers++;
    
    return openFingers;
  };

  // Get status text based on hand state
  const getStatusText = () => {
    switch (handState) {
      case 'open': return 'Hand Open - Bulb at Full Power';
      case 'half-open': return 'Hand Half Open - Bulb at Half Power';
      case 'closed': return 'Hand Closed - Bulb Off';
      case 'detecting': return 'Wave your hand in front of the camera';
      case 'error': return 'Camera access error. Please check permissions.';
      default: return 'Initializing...';
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 font-poppins gradient-text">
            Lokesh Yantram
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A hand gesture-controlled smart bulb interface. Open your hand to turn the bulb on, 
            close it to turn off, or keep it half-open for medium brightness.
          </p>
        </header>
        
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left column - Camera */}
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 font-poppins">Hand Detection</h2>
            
            <div className="viewport-container mb-4">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              )}
              <video 
                ref={videoRef} 
                className="viewport" 
                width="320" 
                height="240" 
                autoPlay 
                playsInline
              ></video>
              <canvas 
                ref={canvasRef} 
                className="hand-overlay" 
                width="320" 
                height="240"
              ></canvas>
            </div>
            
            <div className="status-text">{getStatusText()}</div>
          </div>
          
          {/* Right column - Bulb and profile */}
          <div className="space-y-8">
            {/* Bulb */}
            <div className="bg-card p-6 rounded-lg shadow-lg text-center">
              <h2 className="text-xl font-semibold mb-4 font-poppins">Smart Bulb</h2>
              <div className="bulb-container my-6">
                <div className={`bulb ${bulbPower}`}></div>
              </div>
              <div className="text-sm text-muted-foreground">
                Current power: <span className="font-medium text-foreground">
                  {bulbPower === 'full' ? '100%' : bulbPower === 'half' ? '50%' : '0%'}
                </span>
              </div>
            </div>
            
            {/* Profile */}
            <div className="bg-card p-6 rounded-lg shadow-lg">
              <div className="flex flex-col items-center">
                <img 
                  src="/lovable-uploads/5f1fb033-fcae-4b7e-ab13-77f4e9842118.png" 
                  alt="Lokesh Soni" 
                  className="profile-image mb-4"
                />
                <h2 className="text-xl font-semibold font-poppins">Lokesh Soni</h2>
                <p className="text-muted-foreground text-sm mb-4">Interactive Technology Developer</p>
              </div>
              
              <div className="mt-4" ref={contactLinksRef}>
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">CONNECT</h3>
                <div className="space-y-1">
                  <a href="https://instagram.com/lokesh.soni194" target="_blank" rel="noopener noreferrer" className="contact-link">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span>lokesh.soni194</span>
                  </a>
                  <a href="https://github.com/lokeshhsoni" target="_blank" rel="noopener noreferrer" className="contact-link">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span>lokeshhsoni</span>
                  </a>
                  <a href="https://linkedin.com/in/lokesh-soni-2b3b7034a" target="_blank" rel="noopener noreferrer" className="contact-link">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span>Lokesh Soni</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Lokesh Yantram. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
