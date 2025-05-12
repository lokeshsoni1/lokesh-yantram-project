
import React from 'react';
import { Camera, CameraOff } from 'lucide-react';

interface CameraToggleProps {
  isCameraActive: boolean;
  toggleCamera: () => void;
}

const CameraToggle = ({ isCameraActive, toggleCamera }: CameraToggleProps) => {
  return (
    <button 
      onClick={toggleCamera} 
      className={`camera-toggle ${isCameraActive ? 'camera-on' : 'camera-off'}`}
      aria-label={isCameraActive ? 'Turn camera off' : 'Turn camera on'}
    >
      {isCameraActive ? (
        <>
          <CameraOff size={18} />
          <span>Turn Camera Off</span>
        </>
      ) : (
        <>
          <Camera size={18} />
          <span>Turn Camera On</span>
        </>
      )}
    </button>
  );
};

export default CameraToggle;
