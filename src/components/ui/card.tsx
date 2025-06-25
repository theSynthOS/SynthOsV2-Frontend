import React, { ReactNode } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { useTheme } from 'next-themes';

interface CardProps {
  title: string;
  onClose?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ 
  title, 
  onClose, 
  onBack,
  showBackButton = false,
  children, 
  className = '' 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div 
      className={`w-full max-w-md mx-auto rounded-2xl overflow-hidden border relative ${
        isDark 
          ? 'bg-[#0B0424] border-white/30' 
          : 'bg-[#FAFAF9] border-[#CECECE]'
      } shadow-md ${className}`}
      style={{
        boxShadow: isDark 
          ? 'inset 0 0 20px rgba(143, 99, 233, 1)' 
          : 'inset 0 0 20px rgba(143, 99, 233, 0.2)'
      }}
    >
      {/* Radial/Linear gradient effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark 
            ? 'linear-gradient(to bottom right, rgba(60, 34, 156, 0.7), rgba(11, 4, 36, 0.7))'
            : 'radial-gradient(circle at 0% 15%, rgba(143, 99, 233, 0.35) 0%, transparent 30%)'
        }}
      />

      {/* Header with title and close button */}
      <div className="relative z-10 px-4 py-4 flex items-center justify-between">
        {showBackButton && onBack ? (
          <button 
            onClick={onBack}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              isDark 
                ? 'hover:bg-gray-700/50' 
                : 'hover:bg-gray-200/70'
            }`}
            aria-label="Back"
          >
            <ChevronLeft className={`h-5 w-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
        ) : (
          <div className="w-8"></div> 
        )}
        <h2 className={`text-xl font-medium text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h2>
        {onClose ? (
          <button 
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              isDark 
                ? 'hover:bg-gray-700/50' 
                : 'hover:bg-gray-200/70'
            }`}
            aria-label="Close"
          >
            <X className={`h-5 w-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
        ) : (
          <div className="w-8"></div>
        )}
      </div>

      {/* Card content */}
      <div className="relative z-10 p-4">
        {children}
      </div>
    </div>
  );
};

export default Card;
