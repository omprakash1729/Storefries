import React, { useEffect, useState } from 'react';

interface SoftAuroraProps {
  speed?: number;
  scale?: number;
  brightness?: number;
  color1?: string;
  color2?: string;
  noiseFrequency?: number;
  noiseAmplitude?: number;
  bandHeight?: number;
  bandSpread?: number;
  octaveDecay?: number;
  layerOffset?: number;
  colorSpeed?: number;
  enableMouseInteraction?: boolean;
  mouseInfluence?: number;
}

export const SoftAurora: React.FC<SoftAuroraProps> = ({
  color1 = '#0c52cb',
  color2 = '#23ff00',
  speed = 0.6,
  scale = 1.5,
  enableMouseInteraction = false,
  mouseInfluence = 0.25,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!enableMouseInteraction) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized mouse position from -1 to 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enableMouseInteraction]);

  // Larger movement scale for the horizontal band
  const bandY = mousePos.y * 60 * mouseInfluence;
  const bandX = mousePos.x * 80 * mouseInfluence;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-transparent pointer-events-none flex items-center justify-center">
      {/* Central Horizontal Band Container */}
      <div 
        className="relative w-full max-w-7xl h-[250px] flex items-center justify-center transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${bandX}px, ${bandY}px) scale(${scale})`,
        }}
      >
        {/* Static Glow Backing */}
        <div 
          className="absolute inset-x-0 h-40 rounded-full opacity-20 blur-[120px] dark:opacity-30 mix-blend-screen pointer-events-none animate-pulse"
          style={{
            background: `linear-gradient(90deg, transparent, ${color1}, ${color2}, transparent)`,
            transform: 'scaleX(1.5)',
            animationDuration: '8s'
          }}
        />

        {/* Ribbon Layer 1 (Primary Color) */}
        <div 
          className="absolute w-[120%] h-[80px] rounded-full blur-[60px] opacity-30 dark:opacity-75 mix-blend-screen pointer-events-none animate-aurora-float"
          style={{
            background: `linear-gradient(90deg, transparent 10%, ${color1} 40%, ${color2} 60%, transparent 90%)`,
            top: '20%',
            animationDuration: `${12 / speed}s`,
          }}
        />

        {/* Ribbon Layer 2 (Secondary Color Overlay) */}
        <div 
          className="absolute w-[120%] h-[60px] rounded-full blur-[45px] opacity-25 dark:opacity-65 mix-blend-screen pointer-events-none animate-aurora-float-delayed"
          style={{
            background: `linear-gradient(90deg, transparent 5%, ${color2} 35%, ${color1} 65%, transparent 95%)`,
            bottom: '20%',
            animationDuration: `${16 / speed}s`,
          }}
        />

        {/* Tight Neon Core */}
        <div 
          className="absolute w-[90%] h-[15px] rounded-full blur-[20px] opacity-40 dark:opacity-60 mix-blend-screen pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${color1}, ${color2}, transparent)`,
          }}
        />
      </div>
    </div>
  );
};
