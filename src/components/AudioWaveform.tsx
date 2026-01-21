import { useEffect, useRef, useState } from "react";

interface AudioWaveformProps {
  isActive: boolean;
  type: 'user' | 'ai';
  label?: string;
  barCount?: number;
  volumeLevel?: number;
}

export const AudioWaveform = ({ 
  isActive, 
  type, 
  label, 
  barCount = 7,
  volumeLevel = 0
}: AudioWaveformProps) => {
  const [bars, setBars] = useState<number[]>(Array(barCount).fill(4));
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) {
      setBars(Array(barCount).fill(4));
      return;
    }

    const animate = (timestamp: number) => {
      // Throttle updates to ~30fps for smoother animation
      if (timestamp - lastUpdateRef.current < 33) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastUpdateRef.current = timestamp;

      setBars(prev => 
        prev.map(() => {
          // Base height influenced by volume level
          const baseMultiplier = volumeLevel > 0 ? volumeLevel * 1.5 : 1;
          // Random variation for organic movement
          const randomFactor = 0.3 + Math.random() * 0.7;
          const height = Math.max(4, Math.min(40, 8 + 28 * baseMultiplier * randomFactor));
          return height;
        })
      );
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, barCount, volumeLevel]);

  const colorClass = type === 'user' 
    ? 'from-blue-400 to-indigo-500' 
    : 'from-green-400 to-emerald-500';

  const glowColor = type === 'user' ? 'shadow-blue-400/50' : 'shadow-green-400/50';

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={`flex items-end justify-center gap-1 h-12 px-3 py-2 rounded-xl transition-all duration-300 ${
          isActive 
            ? `bg-gradient-to-t ${colorClass} shadow-lg ${glowColor}` 
            : 'bg-gray-200'
        }`}
      >
        {bars.map((height, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-75 ${
              isActive ? 'bg-white' : 'bg-gray-400'
            }`}
            style={{ 
              height: `${height}px`,
              transitionDelay: `${i * 15}ms`
            }}
          />
        ))}
      </div>
      {label && (
        <span className={`text-xs font-medium transition-colors ${
          isActive 
            ? type === 'user' ? 'text-blue-600' : 'text-green-600'
            : 'text-gray-400'
        }`}>
          {label}
        </span>
      )}
    </div>
  );
};

// Compact inline waveform for smaller spaces
export const InlineWaveform = ({ 
  isActive, 
  type 
}: { 
  isActive: boolean; 
  type: 'user' | 'ai' 
}) => {
  const [bars, setBars] = useState<number[]>([4, 4, 4, 4, 4]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setBars([4, 4, 4, 4, 4]);
      return;
    }

    const animate = () => {
      setBars(prev => 
        prev.map(() => Math.max(3, Math.min(16, 4 + Math.random() * 12)))
      );
      animationRef.current = requestAnimationFrame(animate);
    };

    const interval = setInterval(animate, 80);

    return () => {
      clearInterval(interval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  const colorClass = type === 'user' ? 'bg-blue-500' : 'bg-green-500';

  return (
    <div className="flex items-end gap-0.5 h-4">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`w-0.5 rounded-full transition-all duration-100 ${
            isActive ? colorClass : 'bg-gray-300'
          }`}
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
};
