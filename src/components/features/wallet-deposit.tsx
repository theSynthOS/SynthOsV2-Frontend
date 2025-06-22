import { useState, useEffect, useRef } from 'react';
import { Copy, Check } from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';
import { client } from '@/client';
import QRCode from 'react-qr-code';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Card from '@/components/ui/card';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletDeposit({ isOpen, onClose }: DepositModalProps) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [windowHeight, setWindowHeight] = useState(0);
  const account = useActiveAccount();
  const [displayAddress, setDisplayAddress] = useState<string | null>(null);

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
  
  // Determine which address to display - use ThirdWeb account
  useEffect(() => {
    if (account?.address) {
      setDisplayAddress(account.address);
    }
  }, [account]);

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal close
    if (displayAddress) {
      navigator.clipboard.writeText(displayAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // If theme isn't loaded yet or modal not open, return nothing
  if (!mounted || !isOpen) return null;

  // Calculate dynamic styles based on device height
  const isSmallHeight = windowHeight < 700;
  const contentPadding = isMobile ? (isSmallHeight ? 'p-3' : 'p-4') : 'p-6';
  const qrSize = isMobile ? (isSmallHeight ? 130 : 150) : 180;
  
  // Calculate logo size based on QR code size
  const logoSize = Math.floor(qrSize * 0.40);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
      ></div>
      
      {/* Card Content */}
      <div className="relative z-10 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <Card title="Deposit Funds" onClose={onClose}>
          <div
            className="max-h-[60vh]"
          >
            {!displayAddress ? (
              <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg ${contentPadding} text-center`}>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} ${isMobile ? 'text-sm mb-3' : 'mb-4'}`}>
                  Connect your wallet to get your deposit address
                </p>
              </div>
            ) : (
              <div className={`space-y-${isSmallHeight ? '3' : '4'}`}>
                {/* Wallet Address Section */}
                <div>
                  
                  {/* QR Code with Logo Overlay */}
                  <div className="flex justify-center mb-3">
                    {displayAddress ? (
                      <div className={`'bg-transparent' ${isMobile ? 'p-2' : 'p-3'} rounded-lg relative`}>
                        <QRCode 
                          value={displayAddress} 
                          size={qrSize}
                          level="H" // Use high error correction to allow for logo placement
                          className="mx-auto"
                          bgColor="transparent"
                          fgColor={theme === 'dark' ? "#FFFFFF" : "#000000"}
                          style={{
                            shapeRendering: "crispEdges"
                            
                          }}
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
                            background: theme === 'dark' ? '#1F2937' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            padding: '0.8px',
                            border: `3px solid ${theme === 'dark' ? '#FFFFFF' : '#000000'}`
                          }}
                        >
                          <Image
                            src="/usdc.png"
                            alt="USDC Logo"
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
                  
                  <div className={`text-center p-4 ${isMobile ? 'text-xs' : 'text-sm'} ${theme === 'dark' ? 'text-[#747474]' : 'text-gray-500'}`}>
                    Scan this QR code to get your address
                  </div>

                  <div className={`flex items-start justify-between ${theme === 'dark' ? 'bg-white/5 border-white/40' : 'bg-white border-gray-200'} border rounded-lg ${isMobile ? 'p-2' : 'p-3'} mb-4`}>
                    <div className={`font-mono items-center ${isMobile ? 'text-xs' : 'text-sm'} break-all flex-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {displayAddress || "Please connect your wallet"}
                    </div>
                    <button 
                      onClick={copyToClipboard}
                      className={`ml-2 ${isMobile ? 'p-1' : 'p-1.5'} rounded-full ${theme === 'dark' ? 'hover:bg-gray-500' : 'hover:bg-gray-100'} transition-colors flex-shrink-0`}
                      disabled={!displayAddress}
                    >
                      {copied ? (
                        <Check className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-green-500`} />
                      ) : (
                        <Copy className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Network Information */}
                <div>
                  <h3 className={`font-medium mb-2 ${isMobile ? 'text-sm' : ''}`}> ❗️ Important Information</h3>
                  <ul className={`${isMobile ? 'text-xs' : 'text-sm'} ${theme === 'dark' ? 'text-[#747474]' : 'text-gray-500'} space-y-1`}>
                    <li>• Only send assets on the Scroll Sepolia network</li>
                    <li>• You can send any asset to this address</li>
                    <li>• Transactions may take a few minutes to confirm</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
} 