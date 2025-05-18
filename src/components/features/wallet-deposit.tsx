import { useState, useEffect, useRef } from 'react';
import { X, Copy, Check } from 'lucide-react';
import ConnectWalletButton from '../CustomConnectWallet';
import QRCode from 'react-qr-code';
import { useTheme } from 'next-themes';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  address?: string | null;
}

export default function DepositModal({ isOpen, onClose, isAuthenticated, address }: DepositModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Set mounted state once hydration is complete and detect mobile
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Control body scrolling based on modal open state - improved for mobile Safari
  useEffect(() => {
    if (isOpen) {
      // Save current body styles and scroll position
      const scrollY = window.scrollY;
      const originalStyle = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
        height: document.body.style.height
      };
      
      // Prevent background scrolling and interactions
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      return () => {
        // Restore original body styles
        document.body.style.overflow = originalStyle.overflow;
        document.body.style.position = originalStyle.position;
        document.body.style.top = originalStyle.top;
        document.body.style.width = originalStyle.width;
        document.body.style.height = originalStyle.height;
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Prevent touchmove events from propagating to body
  useEffect(() => {
    if (!isOpen) return;
    
    const preventTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if we're inside the modal content
      if (modalRef.current && modalRef.current.contains(target)) {
        // Allow scrolling within scrollable elements inside the modal
        const isScrollable = (el: HTMLElement) => {
          // Check if the element has a scrollbar
          const hasScrollableContent = el.scrollHeight > el.clientHeight;
          // Get the computed overflow-y style
          const overflowYStyle = window.getComputedStyle(el).overflowY;
          // Check if overflow is set to something scrollable
          const isOverflowScrollable = ['scroll', 'auto'].includes(overflowYStyle);
          
          return hasScrollableContent && isOverflowScrollable;
        };
        
        // Find if we're inside a scrollable container
        let scrollableParent = target;
        while (scrollableParent && modalRef.current.contains(scrollableParent)) {
          if (isScrollable(scrollableParent)) {
            // If we're at the top or bottom edge of the scrollable container, prevent default behavior
            const atTop = scrollableParent.scrollTop <= 0;
            const atBottom = scrollableParent.scrollHeight - scrollableParent.scrollTop <= scrollableParent.clientHeight + 1;
            
            // Check scroll direction using touch position
            if (e.touches.length > 0) {
              const touch = e.touches[0];
              const touchY = touch.clientY;
              
              // Store the last touch position
              const lastTouchY = scrollableParent.getAttribute('data-last-touch-y');
              scrollableParent.setAttribute('data-last-touch-y', touchY.toString());
              
              if (lastTouchY) {
                const touchDelta = touchY - parseFloat(lastTouchY);
                const scrollingUp = touchDelta > 0;
                const scrollingDown = touchDelta < 0;
                
                // Only prevent default if trying to scroll past the edges
                if ((atTop && scrollingUp) || (atBottom && scrollingDown)) {
                  e.preventDefault();
                }
                
                // Allow scrolling within the container
                return;
              }
            }
            return;
          }
          scrollableParent = scrollableParent.parentElement as HTMLElement;
        }
        
        // If we're not in a scrollable container within the modal, prevent default
        e.preventDefault();
      }
    };
    
    // Add the touchmove listener
    document.addEventListener('touchmove', preventTouchMove, { passive: false });
    
    return () => {
      // Remove the touchmove listener
      document.removeEventListener('touchmove', preventTouchMove);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200); // Match animation duration
  };

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // If theme isn't loaded yet or modal not open, return nothing
  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={handleClose}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
      ></div>
      
      {/* Modal Content */}
      <div 
        ref={modalRef}
        className={`absolute bottom-0 left-0 right-0 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} rounded-t-[32px] shadow-xl ${isClosing ? 'animate-slide-down' : 'animate-slide-up'} max-h-[90vh] z-50 flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className={`w-12 h-1.5 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} rounded-full mx-auto my-4 flex-shrink-0`}></div>
        
        {/* Close Button */}
        <button 
          onClick={handleClose} 
          className={`absolute top-4 right-4 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} z-10`}
        >
          <X className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
        </button>
        
        {/* Fixed Header */}
        <h2 className={`text-${isMobile ? 'xl' : '2xl'} font-bold px-6 pt-2 pb-4 flex-shrink-0`}>Deposit Funds</h2>
        
        {/* Modal Content - Scrollable Area with improved scrolling */}
        <div 
          className="px-4 pb-safe overflow-y-auto flex-grow overscroll-contain scrollbar-hide"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            paddingBottom: isMobile ? '6rem' : '8rem'
          }}
        >
          {!isAuthenticated ? (
            <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-${isMobile ? '4' : '6'} text-center`}>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                Connect your wallet to get your deposit address
              </p>
              <ConnectWalletButton />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Wallet Address Section */}
              <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-${isMobile ? '4' : '6'}`}>
                <div className="text-center mb-3">
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium`}>Your Wallet Address</h3>
                </div>
                
                <div className={`flex items-start justify-between ${theme === 'dark' ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'} border rounded-lg p-3 mb-4`}>
                  <div className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'} break-all flex-1 min-h-[40px] ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {address || "Connect wallet"}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent modal close
                      copyToClipboard();
                    }}
                    className={`ml-2 p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-gray-500' : 'hover:bg-gray-100'} transition-colors flex-shrink-0`}
                    disabled={!address}
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    )}
                  </button>
                </div>
                
                {/* QR Code */}
                <div className="flex justify-center mb-3">
                  {address ? (
                    <div className="bg-white p-3 rounded-lg">
                      <QRCode 
                        value={address} 
                        size={isMobile ? 150 : 180} 
                        level="H"
                        className="mx-auto"
                      />
                    </div>
                  ) : (
                    <div className={`w-[${isMobile ? '150' : '180'}px] h-[${isMobile ? '150' : '180'}px] ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'} rounded-lg flex items-center justify-center`}>
                      <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>No address available</span>
                    </div>
                  )}
                </div>
                
                <div className={`text-center ${isMobile ? 'text-xs' : 'text-sm'} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Scan this QR code to get your address
                </div>
              </div>
              
              {/* Network Information */}
              <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-${isMobile ? '4' : '6'}`}>
                <h3 className={`font-medium mb-2 ${isMobile ? 'text-sm' : ''}`}>Important Information</h3>
                <ul className={`${isMobile ? 'text-xs' : 'text-sm'} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} space-y-2`}>
                  <li>• Only send assets on the Scroll Sepolia network</li>
                  <li>• You can send any asset to this address</li>
                  <li>• Transactions may take a few minutes to confirm</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 