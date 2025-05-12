
import React, { useEffect, useRef } from 'react';

const BackgroundAnimations = () => {
  const dnaStrandRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!dnaStrandRef.current) return;
    
    // Create DNA helix particles
    const strand = dnaStrandRef.current;
    const particleCount = 20;
    
    // Clear any existing particles first
    strand.innerHTML = '';
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'dna-particle';
      
      // Position particles in a helix pattern
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 40;
      const offsetY = (i / particleCount) * 100;
      
      particle.style.left = `${50 + Math.cos(angle) * radius}%`;
      particle.style.top = `${offsetY}%`;
      particle.style.animationDelay = `${(i / particleCount) * 10}s`;
      
      strand.appendChild(particle);
    }
  }, []);

  return (
    <>
      {/* Floating particles */}
      <div className="particle particle-1"></div>
      <div className="particle particle-2"></div>
      <div className="particle particle-3"></div>
      
      {/* Circuit lines */}
      <div className="circuit-container">
        <div className="circuit-line"></div>
        <div className="circuit-line"></div>
        <div className="circuit-line"></div>
        <div className="circuit-line"></div>
      </div>
      
      {/* DNA animation */}
      <div className="dna-container">
        <div className="dna-strand" ref={dnaStrandRef}></div>
      </div>
    </>
  );
};

export default BackgroundAnimations;
