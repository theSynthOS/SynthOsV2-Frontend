import { useState, useEffect } from 'react';
import { X, Scan, ArrowRight, ChevronRight, ArrowLeft, Delete } from 'lucide-react';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { client } from '@/client';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';

interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BuyModal({ isOpen, onClose }: BuyModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recentAddresses, setRecentAddresses] = useState<string[]>([]);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'address' | 'amount' | 'confirm'>('address');
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const { toast } = useToast();
  const account = useActiveAccount();
  const [balance, setBalance] = useState('0.00');
  const [isSending, setIsSending] = useState(false);
  const [windowHeight, setWindowHeight] = useState(0);

  // Set mounted state once hydration is complete
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

  // Mock balance for demo purposes
  useEffect(() => {
    // In a real app, this would fetch the actual balance from the blockchain
    // For now, we'll just use a mock value
    setBalance('100.00');
  }, [account]);
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      // Reset state when closing
      setStep('address');
      setAmount('0');
      setRecipientAddress('');
    }, 200); // Match animation duration
  };
  
  const handleScanComplete = (result: string) => {
    setRecipientAddress(result);
    setShowScanner(false);
  };
  
  const handleScanClick = () => {
    setShowScanner(true);
  };
  
  const handleNumberPress = (num: string) => {
    if (amount === '0' && num !== '.') {
      setAmount(num);
    } else {
      // Prevent multiple decimal points
      if (num === '.' && amount.includes('.')) return;
      setAmount(prev => prev + num);
    }
  };
  
  const handleDelete = () => {
    if (amount.length <= 1) {
      setAmount('0');
    } else {
      setAmount(prev => prev.slice(0, -1));
    }
  };
  
  const handlePercentage = (percentage: number) => {
    const balanceValue = parseFloat(balance);
    const calculatedAmount = (balanceValue * percentage / 100).toFixed(2);
    setAmount(calculatedAmount);
  };
  
  const handleNextStep = () => {
    if (parseFloat(amount) > 0) {
      setStep('confirm');
    }
  };
  
  const handlePreviousStep = () => {
    setStep('address');
  };

  const handleSend = () => {
    if (!recipientAddress) {
      toast({
        variant: "destructive",
        title: "Missing Recipient",
        description: "Please enter a valid recipient address."
      });
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount to send."
      });
      return;
    }

    setIsSending(true);

    // Simulate sending process
    setTimeout(() => {
      toast({
        variant: "success",
        title: "Transfer Successful",
        description: `You have successfully sent $${amount} to ${recipientAddress.substring(0, 6)}...${recipientAddress.substring(recipientAddress.length - 4)}`
      });
      
      setIsSending(false);
      setAmount('0');
      setRecipientAddress('');
      setStep('address');
      handleClose();
    }, 2000);
  };

  // If theme isn't loaded yet or modal not open, return nothing
  if (!mounted || !isOpen) return null;

  // Calculate dynamic styles based on device height
  const isSmallHeight = windowHeight < 700;
  const modalMaxHeight = isSmallHeight ? '95vh' : '90vh';
  const amountFontSize = isMobile ? (isSmallHeight ? 'text-5xl' : 'text-6xl') : 'text-7xl';
  const keypadGap = isMobile ? (isSmallHeight ? 'gap-2' : 'gap-3') : 'gap-6';
  const keypadFontSize = isMobile ? (isSmallHeight ? 'text-xl' : 'text-2xl') : 'text-3xl';
  const sectionSpacing = isMobile ? (isSmallHeight ? 'mb-3' : 'mb-4') : 'mb-8';

  return (
    <div className="fixed inset-0 z-50 touch-none" onClick={handleClose}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 dark:bg-black/70  backdrop-blur-sm"
        aria-hidden="true"
      ></div>
      
      {/* Modal Content */}
      <div 
        className={`absolute bottom-0 left-0 right-0 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'} rounded-t-[32px] shadow-xl ${isClosing ? 'animate-slide-down' : 'animate-slide-up'} z-50 overflow-hidden flex flex-col`}
        style={{ maxHeight: modalMaxHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className={`w-12 h-1.5 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} rounded-full mx-auto my-3`}></div>
        
        {/* Close Button */}
        <button 
          onClick={handleClose} 
          className={`absolute top-3 right-3 p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
        >
          <X className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
        </button>
        
        {/* Modal Header */}
        <h2 className={`text-${isMobile ? 'xl' : '2xl'} font-bold text-center mt-2 mb-3`}>Send</h2>
        
        {/* Modal Content - Scrollable Area */}
        <div 
          className={`px-4 pb-safe overflow-y-auto overscroll-contain flex-1`}
          style={{ paddingBottom: isMobile ? '6rem' : '8rem' }}
        >
          {!account ? (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 text-center`}>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                Connect your wallet to send funds.
              </p>
            </div>
          ) : showScanner ? (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 text-center`}>
              <div className="mb-4">
                <div className="w-full h-48 bg-black rounded-lg flex items-center justify-center mb-4">
                  <div className="text-white">Scanning QR Code...</div>
                </div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Position the QR code in the center of the camera
                </p>
              </div>
              <button 
                onClick={() => setShowScanner(false)}
                className={`${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'} py-2 px-6 rounded-lg font-medium`}
              >
                Cancel
              </button>
            </div>
          ) : step === 'address' ? (
            <div className="relative">
              {/* Blurred Content */}
              <div className="filter blur-sm">
                <div className="flex flex-col items-center">
                  {/* Asset Selector */}
                  <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-full px-4 py-1.5 ${sectionSpacing}`}>
                    <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} ${isMobile ? 'text-sm' : ''}`}>Balance: ${balance}</span>
                  </div>
                  
                  {/* Amount Display */}
                  <div className={`text-center ${sectionSpacing}`}>
                    <div className={`${amountFontSize} font-light ${amount !== '0' ? (theme === 'dark' ? 'text-white' : 'text-black') : (theme === 'dark' ? 'text-gray-600' : 'text-gray-300')}`}>
                      ${amount}
                    </div>
                  </div>
                  {/* Numeric Keypad - Fixed at the bottom */}
                  <div className={`grid grid-cols-3 ${keypadGap} w-full ${sectionSpacing} ${isSmallHeight ? 'mt-1' : ''}`}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num, index) => (
                      <button
                        key={index}
                        onClick={() => handleNumberPress(num.toString())}
                        className={`${keypadFontSize} font-medium text-center py-1`}
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={handleDelete}
                      className="flex items-center justify-center"
                    >
                      <Delete className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
                    </button>
                  </div>
                  
                  {/* Continue Button */}
                  <button 
                    onClick={handleNextStep}
                    disabled={parseFloat(amount) <= 0}
                    className={`w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-full py-3 px-4 flex items-center justify-between ${sectionSpacing}`}
                  >
                    <div className="w-6"></div> {/* Spacer for alignment */}
                    <div className="text-center flex-1">
                      Next 
                    </div>
                    <div className="flex items-center">
                      <ChevronRight className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                  </button>
                </div>
              </div>

              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className={`text-xl font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    Coming Soon
                  </p>
                  <p className={`mt-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    Send functionality will be available on mainnet launch. 
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Back Button */}
              <button 
                onClick={handlePreviousStep}
                className={`flex items-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-2`}
              >
                <ArrowLeft className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-1`} />
                <span className={`${isMobile ? 'text-sm' : ''}`}>Back</span>
              </button>
              
              {/* Amount Summary */}
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-3 mb-4`}>
                <div className="flex justify-between items-center">
                  <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} ${isMobile ? 'text-sm' : ''}`}>Amount</span>
                  <div className="flex items-center">
                    <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>${amount}</span>
                    <button 
                      onClick={handlePreviousStep} 
                      className={`ml-2 text-blue-500 ${isMobile ? 'text-xs' : 'text-sm'}`}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Recipient Address */}
              <div>
                <div className='flex'>
                <label className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Recipient Address
                </label>
                <p className='text-red-500'>*</p>
                </div>
                <div className="flex">
                  <input 
                    type="text" 
                    placeholder="0x123...45AB5" 
                    className={`flex-1 p-2 ${isMobile ? 'text-sm' : ''} ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'} rounded-l-lg`}
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    required
                  />
                  <button 
                    onClick={handleScanClick}
                    className={`${theme === 'dark' ? 'bg-gray-700 border-gray-700' : 'bg-gray-100 border-gray-300'} p-2 border border-l-0 rounded-r-lg`}
                  >
                    <Scan className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  </button>
                </div>
              </div>
              
              {/* Network Fee */}
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-3 mt-4`}>
                <div className="flex justify-between mb-2">
                  <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} ${isMobile ? 'text-xs' : 'text-sm'}`}>Network Fee</span>
                  <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>~0.0001 ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} ${isMobile ? 'text-xs' : 'text-sm'}`}>Estimated Total</span>
                  <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>${(parseFloat(amount) + 0.01).toFixed(2)}</span>
                </div>
              </div>
              
              {/* Chain Information */}
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-3 mt-4`}>
                <div className="flex justify-between">
                  <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} ${isMobile ? 'text-xs' : 'text-sm'}`}>Network</span>
                  <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Scroll Sepolia</span>
                </div>
              </div>
              
              {/* Send Button */}
              <button 
                className={`mt-4 w-full bg-green-600 text-white py-2.5 px-4 rounded-lg flex items-center justify-center disabled:bg-green-400 mb-4`}
                disabled={!recipientAddress || parseFloat(amount) <= 0 || isSending}
                onClick={handleSend}
              >
                <span className={`mr-2 ${isMobile ? 'text-sm' : ''}`}>{isSending ? 'Sending...' : 'Send'}</span>
                {!isSending && <ArrowRight className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 