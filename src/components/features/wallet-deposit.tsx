import { useState, useEffect, useRef } from 'react';
import { X, Copy, Check } from 'lucide-react';
import ConnectWalletButton from '../CustomConnectWallet';
import QRCode from 'react-qr-code';
import { useTheme } from 'next-themes';
import Image from 'next/image';

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
  const [windowHeight, setWindowHeight] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Set mounted state once hydration is complete and detect mobile
  useEffect(() => {
    setMounted(true);
    
    // Check if the device is mobile and update window height
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      setWindowHeight(window.innerHeight);
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

  // Ensure content is scrollable after modal opens
  useEffect(() => {
    if (isOpen && contentRef.current) {
      // Force a reflow to ensure scroll detection works properly
      setTimeout(() => {
        if (contentRef.current) {
          const isScrollable = contentRef.current.scrollHeight > contentRef.current.clientHeight;
          if (isScrollable) {
            // Add a class to indicate scrollability for visual feedback if needed
            contentRef.current.classList.add('is-scrollable');
          }
        }
      }, 100);
    }
  }, [isOpen, address, isAuthenticated]);

  // Prevent touchmove events from propagating to body
  useEffect(() => {
    if (!isOpen) return;
    
    const preventTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      
      if (modalRef.current && modalRef.current.contains(target)) {
        // Find if we're inside a scrollable container
        const isScrollable = (el: HTMLElement) => {
          const hasScrollableContent = el.scrollHeight > el.clientHeight;
          const overflowYStyle = window.getComputedStyle(el).overflowY;
          const isOverflowScrollable = ['scroll', 'auto'].includes(overflowYStyle);
          return hasScrollableContent && isOverflowScrollable;
        };
        
        let scrollableParent = target;
        while (scrollableParent && modalRef.current.contains(scrollableParent)) {
          if (isScrollable(scrollableParent)) {
            const atTop = scrollableParent.scrollTop <= 0;
            const atBottom = scrollableParent.scrollHeight - scrollableParent.scrollTop <= scrollableParent.clientHeight + 1;
            
            if (e.touches.length > 0) {
              const touch = e.touches[0];
              const touchY = touch.clientY;
              
              const lastTouchY = scrollableParent.getAttribute('data-last-touch-y');
              scrollableParent.setAttribute('data-last-touch-y', touchY.toString());
              
              if (lastTouchY) {
                const touchDelta = touchY - parseFloat(lastTouchY);
                const scrollingUp = touchDelta > 0;
                const scrollingDown = touchDelta < 0;
                
                if ((atTop && scrollingUp) || (atBottom && scrollingDown)) {
                  e.preventDefault();
                }
                return;
              }
            }
            return;
          }
          scrollableParent = scrollableParent.parentElement as HTMLElement;
        }
        
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchmove', preventTouchMove, { passive: false });
    
    return () => {
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

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal close
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // If theme isn't loaded yet or modal not open, return nothing
  if (!mounted || !isOpen) return null;

  // Calculate dynamic styles based on device height
  const isSmallHeight = windowHeight < 700;
  const modalMaxHeight = isSmallHeight ? '92vh' : '85vh';
  const contentPadding = isMobile ? (isSmallHeight ? 'p-3' : 'p-4') : 'p-6';
  const headingSize = isMobile ? (isSmallHeight ? 'text-lg' : 'text-xl') : 'text-2xl';
  const qrSize = isMobile ? (isSmallHeight ? 130 : 150) : 180;
  
  // Calculate logo size based on QR code size
  const logoSize = Math.floor(qrSize * 0.40);

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
        className={`absolute bottom-0 left-0 right-0 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} rounded-t-[32px] shadow-xl ${isClosing ? 'animate-slide-down' : 'animate-slide-up'} z-50 overflow-hidden flex flex-col`}
        style={{ maxHeight: modalMaxHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className={`w-12 h-1.5 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} rounded-full mx-auto my-3 flex-shrink-0`}></div>
        
        {/* Close Button */}
        <button 
          onClick={handleClose} 
          className={`absolute top-3 right-3 p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} z-10`}
        >
          <X className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
        </button>
        
        {/* Fixed Header */}
        <h2 className={`${headingSize} font-bold px-6 pt-1 pb-2 flex-shrink-0 text-center`}>Deposit Funds</h2>
        
        {/* Modal Content - Scrollable Area */}
        <div 
          ref={contentRef}
          className="px-4 flex-grow overflow-y-auto overscroll-contain scrollbar-hide touch-auto"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            paddingBottom: isMobile ? '6rem' : '8rem',
            minHeight: '100px', // Ensure there's enough height to trigger scrolling
          }}
        >
          {!isAuthenticated ? (
            <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg ${contentPadding} text-center`}>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} ${isMobile ? 'text-sm mb-3' : 'mb-4'}`}>
                Connect your wallet to get your deposit address
              </p>
              <ConnectWalletButton />
            </div>
          ) : (
            <div className={`space-y-${isSmallHeight ? '3' : '4'}`}>
              {/* Wallet Address Section */}
              <div className={`${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg ${contentPadding}`}>
                <div className="text-center mb-2">
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium`}>Your Wallet Address</h3>
                </div>
                
                <div className={`flex items-start justify-between ${theme === 'dark' ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'} border rounded-lg ${isMobile ? 'p-2' : 'p-3'} mb-4`}>
                  <div className={`font-mono ${isMobile ? 'text-xs' : 'text-sm'} break-all flex-1 min-h-[40px] ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {address || "Connect wallet"}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className={`ml-2 ${isMobile ? 'p-1' : 'p-1.5'} rounded-full ${theme === 'dark' ? 'hover:bg-gray-500' : 'hover:bg-gray-100'} transition-colors flex-shrink-0`}
                    disabled={!address}
                  >
                    {copied ? (
                      <Check className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-green-500`} />
                    ) : (
                      <Copy className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    )}
                  </button>
                </div>
                
                {/* QR Code with Logo Overlay */}
                <div className="flex justify-center mb-3">
                  {address ? (
                    <div className={`bg-white ${isMobile ? 'p-2' : 'p-3'} rounded-lg relative`}>
                      <QRCode 
                        value={address} 
                        size={qrSize}
                        level="H" // Use high error correction to allow for logo placement
                        className="mx-auto"
                      />
                      {/* Logo Overlay */}
                      <div 
                        className="absolute" 
                        style={{
                          top: '50%', 
                          left: '50%', 
                          transform: 'translate(-50%, -50%)',
                          width: `${logoSize}px`,
                          height: `${logoSize}px`,
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          padding: '1px',
                          border: '6px solid #000000'
                        }}
                      >
                        <Image
                          src="/SynthOS-transparent.png"
                          alt="SynthOS Logo"
                          width={logoSize}
                          height={logoSize}
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className={`w-[${qrSize}px] h-[${qrSize}px] ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'} rounded-lg flex items-center justify-center`}>
                      <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} ${isMobile ? 'text-xs' : 'text-sm'}`}>No address available</span>
                    </div>
                  )}
                </div>
                
                <div className={`text-center ${isMobile ? 'text-xs' : 'text-sm'} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Scan this QR code to get your address
                </div>
              </div>
              
              {/* Network Information */}
              <div className={`${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg ${contentPadding}`}>
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