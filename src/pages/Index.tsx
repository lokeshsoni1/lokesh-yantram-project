
import React, { useEffect, useRef, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";
import { Camera } from "lucide-react";
import CameraToggle from "@/components/CameraToggle";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import BackgroundAnimations from "@/components/BackgroundAnimations";

// Import the MediaPipe types (TypeScript will use this)
import '../types/mediapipe';

// Define theme options
type ThemeOption = 'blue' | 'dark' | 'purple' | 'green' | 'cyberpunk' | 'neon';

const Index = () => {
  // Refs for DOM elements and MediaPipe
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contactLinksRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<any>(null);
  const frameRef = useRef<number | null>(null);
  
  // State variables
  const [handState, setHandState] = useState<string>('detecting');
  const [bulbPower, setBulbPower] = useState<string>('off');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMediaPipeLoading, setIsMediaPipeLoading] = useState<boolean>(true);
  const [isMediaPipeLoaded, setIsMediaPipeLoaded] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false);
  const [theme, setTheme] = useState<ThemeOption>('blue');
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState<boolean>(false);
  
  // Access toast utilities
  const { toast } = useToast();

  // Set theme on the body element
  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  // Initialize MediaPipe - using a more reliable CDN approach
  useEffect(() => {
    const loadMediaPipeScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (document.querySelector('script[src*="hands.js"]')) {
          console.log("MediaPipe script already loaded");
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          console.log("MediaPipe script loaded successfully");
          resolve();
        };
        script.onerror = (err) => {
          console.error("Failed to load MediaPipe script:", err);
          reject(new Error('Failed to load MediaPipe script'));
        };
        document.body.appendChild(script);
      });
    };

    const initializeMediaPipe = async () => {
      try {
        setIsMediaPipeLoading(true);
        
        // Load the MediaPipe script first
        await loadMediaPipeScript();
        
        // Now initialize the MediaPipe Hands
        if (window.Hands) {
          // Create a new Hands instance
          handsRef.current = new window.Hands({
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
          setIsMediaPipeLoading(false);
          setIsLoading(false);
          
          console.log("MediaPipe Hands initialized successfully");
          
          toast({
            title: "System Ready",
            description: "Click the camera button to start hand detection",
          });
        } else {
          throw new Error('MediaPipe Hands not available');
        }
      } catch (error) {
        console.error('Failed to initialize MediaPipe Hands:', error);
        setIsMediaPipeLoading(false);
        setIsLoading(false);
        
        sonnerToast.error("MediaPipe initialization failed", {
          description: "Please refresh the page and try again.",
          duration: 5000
        });
      }
    };
    
    initializeMediaPipe();
    
    // Clean up function
    return () => {
      // Clean up MediaPipe resources
      if (handsRef.current) {
        try {
          handsRef.current.close();
        } catch (e) {
          console.error('Error closing MediaPipe:', e);
        }
      }
      
      // Cancel any animation frames
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      
      // Clean up any active streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

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
  
  // Function to toggle camera on/off
  const toggleCamera = async () => {
    // If camera is already active, turn it off
    if (isCameraActive) {
      stopCamera();
      return;
    }
    
    // Turn camera on
    try {
      if (!videoRef.current || !isMediaPipeLoaded) {
        if (!isMediaPipeLoaded) {
          toast({
            title: "MediaPipe Not Ready",
            description: "Please wait for the hand detection system to initialize",
            variant: "destructive"
          });
        }
        return;
      }
      
      setIsCameraLoading(true);
      setCameraPermissionDenied(false);
      
      // First try to access user-facing camera (for mobile devices)
      let stream;
      try {
        // Try user-facing camera first
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });
      } catch (frontErr) {
        console.warn("Failed to access front camera, trying any available camera:", frontErr);
        
        // If front camera fails, try any camera
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        } catch (anyErr) {
          throw anyErr; // If this fails too, propagate the error
        }
      }
      
      // Successfully got a stream
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      videoRef.current.onloadedmetadata = () => {
        if (!videoRef.current) return;
        
        videoRef.current.play()
          .then(() => {
            setIsCameraActive(true);
            setIsCameraLoading(false);
            
            // Adjust canvas dimensions to match video
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
            
            toast({
              title: "Camera Activated",
              description: "Hand detection is now running",
            });
            
            // Start processing frames
            sendFramesToMediaPipe();
          })
          .catch(error => {
            console.error('Error playing video:', error);
            setIsCameraLoading(false);
            stopCamera();
            
            toast({
              title: "Video Playback Error",
              description: "Could not start the camera feed",
              variant: "destructive"
            });
          });
      };
    } catch (error) {
      console.error('Error accessing webcam:', error);
      setIsCameraLoading(false);
      setHandState('error');
      setCameraPermissionDenied(true);
      
      // More descriptive error message
      let errorMessage = "Please allow camera access to use this app";
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera access was denied. Please allow camera permissions in your browser settings.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera was found on your device.";
        } else if (error.name === 'NotReadableError') {
          errorMessage = "Camera is already in use by another application.";
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = "The requested camera settings are not available.";
        }
      }
      
      toast({
        title: "Camera Access Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Stop camera and cleanup
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Cancel animation frame if it exists
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    
    setIsCameraActive(false);
    setHandState('detecting');
    setBulbPower('off');
    
    toast({
      title: "Camera Turned Off",
      description: "Hand detection has stopped",
    });
  };

  // Process video frames with MediaPipe
  const sendFramesToMediaPipe = () => {
    if (!videoRef.current || !handsRef.current || !canvasRef.current || !isCameraActive) {
      return;
    }

    const videoElement = videoRef.current;
    
    // Make sure the video is playing
    if (videoElement.paused || videoElement.ended) {
      return;
    }

    try {
      // Process the current frame
      handsRef.current.send({image: videoElement});
    } catch (error) {
      console.error('Error processing frame:', error);
    }
    
    // Request the next frame (only if camera is still active)
    if (isCameraActive) {
      frameRef.current = requestAnimationFrame(sendFramesToMediaPipe);
    }
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
    }
  };

  // Draw hand landmarks on canvas
  const drawHandLandmarks = (
    ctx: CanvasRenderingContext2D, 
    landmarks: any[], 
    width: number, 
    height: number
  ) => {
    // Get color based on theme
    let lineColor, pointColor;
    
    switch (theme) {
      case 'green':
        lineColor = '#4ade80';
        pointColor = '#22c55e';
        break;
      case 'purple':
        lineColor = '#a78bfa';
        pointColor = '#8b5cf6';
        break;
      case 'dark':
        lineColor = '#e2e8f0';
        pointColor = '#f8fafc';
        break;
      case 'cyberpunk':
        lineColor = '#ff00ff';
        pointColor = '#00ffff';
        break;
      case 'neon':
        lineColor = '#39ff14';
        pointColor = '#00ffff';
        break;
      default: // blue theme
        lineColor = '#60a5fa';
        pointColor = '#3b82f6';
    }
    
    // Draw connections between landmarks
    ctx.lineWidth = 2;
    ctx.strokeStyle = lineColor;
    
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
    ctx.fillStyle = pointColor;
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
    
    // Check if thumb is extended (different for left vs right hand)
    // This is a simplified check that works better across different hand orientations
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const thumbMcp = landmarks[2];
    const wrist = landmarks[0]; 
    
    // Calculate distance from wrist to check if thumb is extended
    const distanceFromWrist = Math.sqrt(
      Math.pow(thumbTip.x - wrist.x, 2) + 
      Math.pow(thumbTip.y - wrist.y, 2)
    );
    
    const distanceFromMcp = Math.sqrt(
      Math.pow(thumbTip.x - thumbMcp.x, 2) + 
      Math.pow(thumbTip.y - thumbMcp.y, 2)
    );
    
    // If thumb tip is far enough from wrist and MCP, consider it extended
    if (distanceFromWrist > 0.15 && distanceFromMcp > 0.08) {
      openFingers++;
    }
    
    // For the four fingers, check if the tip is above (lower y value) than the PIP joint
    // Index finger
    if (landmarks[8].y < landmarks[6].y) openFingers++;
    
    // Middle finger
    if (landmarks[12].y < landmarks[10].y) openFingers++;
    
    // Ring finger
    if (landmarks[16].y < landmarks[14].y) openFingers++;
    
    // Pinky
    if (landmarks[20].y < landmarks[18].y) openFingers++;
    
    return openFingers;
  };

  // Get status text based on hand state
  const getStatusText = () => {
    if (isMediaPipeLoading) return 'Initializing hand detection system...';
    if (cameraPermissionDenied) return 'Camera access was denied. Please check permissions.';
    if (isCameraLoading) return 'Starting camera...';
    if (!isCameraActive) return 'Click the button below to turn on camera';
    
    switch (handState) {
      case 'open': return 'Hand Open - Bulb at Full Power';
      case 'half-open': return 'Hand Half Open - Bulb at Half Power';
      case 'closed': return 'Hand Closed - Bulb Off';
      case 'detecting': return 'Show your hand in front of the camera';
      case 'error': return 'Camera access error. Please check permissions.';
      default: return 'Processing...';
    }
  };

  return (
    <div className={`min-h-screen bg-background py-10 px-4 sm:px-6`}>
      <BackgroundAnimations />
      
      {/* Tech animations container */}
      <div className="tech-particles-container">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="tech-particle" 
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.5,
              animation: `pulse ${Math.random() * 3 + 2}s infinite alternate`
            }}
          />
        ))}
      </div>
      
      {/* Digital circuit background */}
      <div className="digital-circuit">
        {[...Array(10)].map((_, i) => (
          <div 
            key={`line-${i}`} 
            className="digital-line" 
            style={{
              top: `${Math.random() * 100}%`,
              left: 0,
              width: '100%',
              height: '1px'
            }}
          />
        ))}
        {[...Array(10)].map((_, i) => (
          <div 
            key={`line-v-${i}`} 
            className="digital-line" 
            style={{
              left: `${Math.random() * 100}%`,
              top: 0,
              width: '1px',
              height: '100%'
            }}
          />
        ))}
        {[...Array(15)].map((_, i) => (
          <div 
            key={`node-${i}`} 
            className="digital-node" 
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
      
      <div className="max-w-4xl mx-auto">
        {/* Header with Theme Switcher */}
        <header className="text-center mb-10 relative">
          <div className="absolute right-0 top-0">
            <ThemeSwitcher currentTheme={theme} setTheme={setTheme} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 font-poppins gradient-text">
            Lokesh Yantram
          </h1>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <span className="tech-badge">AI</span>
            <span className="tech-badge">Hand Detection</span>
            <span className="tech-badge">Interactive</span>
          </div>
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
              {(isLoading || isMediaPipeLoading) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              )}
              
              {!isCameraActive && !isCameraLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                  <div className="text-center p-4">
                    <Camera className="mx-auto mb-2 opacity-50" size={40} />
                    <p className="text-sm opacity-80">Camera is turned off</p>
                  </div>
                </div>
              )}
              
              <video 
                ref={videoRef} 
                className="viewport" 
                width="320" 
                height="240" 
                autoPlay 
                playsInline
                muted // Important for mobile devices
              ></video>
              <canvas 
                ref={canvasRef} 
                className="hand-overlay" 
                width="320" 
                height="240"
              ></canvas>
            </div>
            
            <div className="status-text mb-4">{getStatusText()}</div>
            
            <div className="flex justify-center">
              <CameraToggle 
                isCameraActive={isCameraActive} 
                toggleCamera={toggleCamera}
                isLoading={isCameraLoading || isMediaPipeLoading}
              />
            </div>
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
