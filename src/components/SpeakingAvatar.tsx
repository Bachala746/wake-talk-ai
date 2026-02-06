import { Bot, User } from "lucide-react";

interface SpeakingAvatarProps {
  type: 'user' | 'ai';
  isActive: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SpeakingAvatar = ({ type, isActive, size = 'md' }: SpeakingAvatarProps) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  const ringOffset = {
    sm: '-inset-1.5',
    md: '-inset-2',
    lg: '-inset-2.5',
  };

  const outerRingOffset = {
    sm: '-inset-3',
    md: '-inset-4',
    lg: '-inset-5',
  };

  const gradientClass = type === 'ai'
    ? 'from-emerald-400 to-green-500'
    : 'from-blue-400 to-indigo-500';

  const inactiveGradient = type === 'ai'
    ? 'from-gray-300 to-gray-400'
    : 'from-gray-300 to-gray-400';

  const ringColor = type === 'ai'
    ? 'border-emerald-400/60'
    : 'border-blue-400/60';

  const outerRingColor = type === 'ai'
    ? 'border-emerald-300/30'
    : 'border-blue-300/30';

  const glowShadow = type === 'ai'
    ? '0 0 20px rgba(52, 211, 153, 0.4), 0 0 40px rgba(52, 211, 153, 0.15)'
    : '0 0 20px rgba(96, 165, 250, 0.4), 0 0 40px rgba(96, 165, 250, 0.15)';

  const Icon = type === 'ai' ? Bot : User;

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse ring — only when active */}
      {isActive && (
        <>
          <div
            className={`absolute ${outerRingOffset[size]} rounded-full border-2 ${outerRingColor} animate-[avatar-ring-pulse_2s_ease-out_infinite]`}
          />
          <div
            className={`absolute ${ringOffset[size]} rounded-full border-2 ${ringColor} animate-[avatar-ring-pulse_2s_ease-out_infinite_0.4s]`}
          />
        </>
      )}

      {/* Avatar circle */}
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br flex items-center justify-center transition-all duration-500 ${
          isActive
            ? `${gradientClass} animate-[avatar-breathe_2.4s_ease-in-out_infinite]`
            : inactiveGradient
        }`}
        style={isActive ? { boxShadow: glowShadow } : undefined}
      >
        <Icon className={`${iconSizes[size]} text-white drop-shadow-sm`} />
      </div>

      {/* Active dot indicator */}
      {isActive && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
            type === 'ai' ? 'bg-emerald-400' : 'bg-blue-400'
          } animate-pulse`}
        />
      )}
    </div>
  );
};
