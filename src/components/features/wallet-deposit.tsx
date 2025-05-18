import { useState, useEffect } from 'react';
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

  // Set mounted state once hydration is complete
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Control body scrolling based on modal open state
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    // Re-enable scrolling when component unmounts or modal closes
    return () => {
      document.body.style.overflow = 'auto';
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
      setTimeout(() => setCopied(false), 8000);
    }
  };

  // If theme isn't loaded yet or modal not open, return nothing
  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 touch-none" onClick={handleClose}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
      ></div>
      
      {/* Modal Content */}
      <div 
        className={`absolute bottom-0 left-0 right-0 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} rounded-t-[32px] shadow-xl ${isClosing ? 'animate-slide-down' : 'animate-slide-up'} max-h-[90%] z-50 flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className={`w-12 h-1.5 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} rounded-full mx-auto my-4 flex-shrink-0`}></div>
        
        {/* Close Button */}
        <button 
          onClick={handleClose} 
          className={`absolute top-4 right-4 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} z-10`}
        >
          <X className="h-6 w-6" />
        </button>
        
        {/* Modal Content - Scrollable Area */}
        <div className="p-6 pb-20 overflow-y-auto overscroll-contain touch-auto flex-grow" style={{ WebkitOverflowScrolling: 'touch' }}>
          <h2 className="text-2xl font-bold mb-6">Deposit Funds</h2>
          
          {!isAuthenticated ? (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-6 text-center`}>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                Connect your wallet to get your deposit address
              </p>
              <ConnectWalletButton />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Wallet Address Section */}
              <div className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'} rounded-lg p-6`}>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium">Your Wallet Address</h3>
                  {/* <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Copy and paste this address to send funds to your wallet</p> */}
                </div>
                
                <div className={`flex items-start justify-between ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border rounded-lg p-4 mb-6`}>
                  <div className={`font-mono text-sm break-all flex-1 min-h-[40px] ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {address || "Connect wallet"}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className={`ml-2 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'} transition-colors flex-shrink-0`}
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
                <div className="flex justify-center mb-4">
                  {address ? (
                    <div className={`${theme === 'dark' ? 'bg-white' : 'bg-white'} p-4 rounded-lg`}>
                      <QRCode 
                        value={address} 
                        size={180} 
                        level="H"
                        className="mx-auto"
                      />
                    </div>
                  ) : (
                    <div className={`w-[180px] h-[180px] ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg flex items-center justify-center`}>
                      <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>No address available</span>
                    </div>
                  )}
                </div>
                
                <div className={`text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Scan this QR code to get your address
                </div>
              </div>
              
              {/* Network Information */}
              <div className={`${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-lg p-6`}>
                <h3 className="font-medium mb-2">Important Information</h3>
                <ul className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} space-y-2`}>
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