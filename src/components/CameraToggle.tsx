
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
      className={`
        flex items-center justify-center gap-2 px-4 py-2 rounded-full 
        transition-all duration-300 font-medium text-sm
        ${isCameraActive 
          ? 'bg-red-500 hover:bg-red-600 text-white' 
          : 'bg-emerald-500 hover:bg-emerald-600 text-white'}
        ${isLoading ? 'opacity-70 cursor-not-allowed' : 'opacity-100 cursor-pointer'}
        shadow-md hover:shadow-lg
      `}
      aria-label={isCameraActive ? 'Turn camera off' : 'Turn camera on'}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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
