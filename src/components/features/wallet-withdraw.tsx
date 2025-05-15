import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import ConnectWalletButton from '../CustomConnectWallet';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  address?: string | null;
}

export default function WithdrawModal({ isOpen, onClose, isAuthenticated, address }: WithdrawModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [amount, setAmount] = useState('');
  const { toast } = useToast();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Set mounted state once hydration is complete
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200); // Match animation duration
  };

  const handleWithdraw = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid amount to withdraw."
      });
      return;
    }

    // Simulate withdrawal process
    setTimeout(() => {
      toast({
        variant: "success",
        title: "Withdrawal Successful",
        description: `You have successfully withdrawn ${amount} to your wallet.`
      });
      
      setAmount('');
      handleClose();
    }, 1500);
  };

  // If theme isn't loaded yet, return nothing to avoid flash
  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={(e) => e.stopPropagation()}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      ></div>
      
      {/* Modal Content */}
      <div className={`absolute bottom-0 left-0 right-0 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'} rounded-t-[32px] shadow-xl ${isClosing ? 'animate-slide-down' : 'animate-slide-up'} h-[90%] z-50 overflow-hidden`}>
        {/* Drag Handle */}
        <div className={`w-12 h-1.5 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} rounded-full mx-auto my-4`}></div>
        
        {/* Close Button */}
        <button 
          onClick={handleClose} 
          className={`absolute top-4 right-4 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
        >
          <X className="h-6 w-6" />
        </button>
        
        {/* Modal Content - Scrollable Area */}
        <div className="p-6 pb-20 h-full overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6">Withdraw Funds</h2>
          
          {!isAuthenticated ? (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-6 text-center`}>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                Connect your wallet to withdraw funds.
              </p>
              <ConnectWalletButton />
            </div>
          ) : (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-6 text-center`}>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Select an asset to withdraw to your wallet.
              </p>
              
              <div className="mt-4 text-left">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Amount to withdraw
                </label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  className={`w-full p-2 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'} rounded-lg`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <button 
                  className="mt-4 w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                  onClick={handleWithdraw}
                >
                  Withdraw
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 