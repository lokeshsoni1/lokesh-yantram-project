
import React from 'react';
import { Camera, CameraOff } from 'lucide-react';

interface CameraToggleProps {
  isCameraActive: boolean;
  toggleCamera: () => void;
  isLoading?: boolean;
}

const CameraToggle = ({ isCameraActive, toggleCamera, isLoading = false }: CameraToggleProps) => {
  return (
    <button 
      onClick={toggleCamera} 
      className={`camera-toggle ${isCameraActive ? 'camera-on' : 'camera-off'} ${isLoading ? 'loading' : ''}`}
      aria-label={isCameraActive ? 'Turn camera off' : 'Turn camera on'}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <span className="loading-spinner"></span>
          <span>Loading...</span>
        </>
      ) : isCameraActive ? (
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
