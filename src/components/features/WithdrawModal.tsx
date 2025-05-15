import { useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [amount, setAmount] = useState('');
  const { toast } = useToast();

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

  return (
    <div className="fixed inset-0 z-50" onClick={(e) => e.stopPropagation()}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      ></div>
      
      {/* Modal Content */}
      <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-xl ${isClosing ? 'animate-slide-down' : 'animate-slide-up'} h-[90%] z-50 overflow-hidden`}>
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-4"></div>
        
        {/* Close Button */}
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
        >
          <X className="h-6 w-6" />
        </button>
        
        {/* Modal Content - Scrollable Area */}
        <div className="p-6 pb-20 h-full overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6">Withdraw Funds</h2>
          
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-500">
              Select an asset to withdraw to your wallet.
            </p>
            
            <div className="mt-4 text-left">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount to withdraw
              </label>
              <input 
                type="number" 
                placeholder="0.00" 
                className="w-full p-2 border border-gray-300 rounded-lg"
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
        </div>
      </div>
    </div>
  );
} 