import { useState, useEffect } from 'react';
import { X, Scan, ArrowRight, ChevronRight, ArrowLeft, Delete } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendModal({ isOpen, onClose }: SendModalProps) {
  const { address } = useAuth();
  const [isClosing, setIsClosing] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Amount, Step 2: Recipient
  const [amount, setAmount] = useState('0');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [balance, setBalance] = useState('0.00');

  // Mock balance for demo purposes
  useEffect(() => {
    // In a real app, this would fetch the actual balance from the blockchain
    // For now, we'll just use a mock value
    setBalance('100.00');
  }, [address]);
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      // Reset state when closing
      setStep(1);
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
      setStep(2);
    }
  };
  
  const handlePreviousStep = () => {
    setStep(1);
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
        <div className="p-6 pb-20 h-full ">
          <h2 className="text-2xl font-bold mb-6 text-center">Send</h2>
          
          {showScanner ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="mb-4">
                <div className="w-full h-64 bg-black rounded-lg flex items-center justify-center mb-4">
                  <div className="text-white">Scanning QR Code...</div>
                </div>
                <p className="text-sm text-gray-500">
                  Position the QR code in the center of the camera
                </p>
              </div>
              <button 
                onClick={() => setShowScanner(false)}
                className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          ) : step === 1 ? (
            <div className="flex flex-col items-center">
              {/* Asset Selector */}
              <div className="bg-gray-100 rounded-full px-6 py-2 mb-8">
                <span className="text-gray-700">Balance: ${balance}</span>
              </div>
              
              {/* Amount Display */}
              <div className="text-center mb-8">
                <div className={`text-7xl font-light ${amount !== '0' ? 'text-black' : 'text-gray-300'}`}>
                  ${amount}
                </div>
              </div>
              
              {/* Percentage Buttons */}
              <div className="flex justify-between w-full mb-8 gap-2">
                <button 
                  onClick={() => handlePercentage(10)}
                  className="flex-1 bg-gray-100 rounded-full py-3 text-center font-medium"
                >
                  10%
                </button>
                <button 
                  onClick={() => handlePercentage(25)}
                  className="flex-1 bg-gray-100 rounded-full py-3 text-center font-medium"
                >
                  25%
                </button>
                <button 
                  onClick={() => handlePercentage(50)}
                  className="flex-1 bg-gray-100 rounded-full py-3 text-center font-medium"
                >
                  50%
                </button>
                <button 
                  onClick={() => handlePercentage(100)}
                  className="flex-1 bg-gray-100 rounded-full py-3 text-center font-medium"
                >
                  MAX
                </button>
              </div>
              
              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-6 w-full mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num, index) => (
                  <button
                    key={index}
                    onClick={() => handleNumberPress(num.toString())}
                    className="text-3xl font-medium text-center py-2"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center"
                >
                  <Delete className="h-6 w-6" />
                </button>
              </div>
              
              {/* Continue Button */}
              <button 
                onClick={handleNextStep}
                disabled={parseFloat(amount) <= 0}
                className="w-full bg-gray-100 rounded-full py-4 px-6 flex items-center justify-between"
              >
                <div className="w-6"></div> {/* Spacer for alignment */}
                <div className="text-center flex-1">
                  Next 
                </div>
                <div className="flex items-center">
                  <ChevronRight className="h-6 w-6 text-gray-500" />
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Back Button */}
              <button 
                onClick={handlePreviousStep}
                className="flex items-center text-gray-500 mb-4"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                <span>Back</span>
              </button>
              
              {/* Amount Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Amount</span>
                  <div className="flex items-center">
                    <span className="font-medium">${amount}</span>
                    <button 
                      onClick={handlePreviousStep} 
                      className="ml-2 text-blue-500 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Recipient Address */}
              <div>
                <div className='flex'>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Address
                </label>
                <p className='text-red-500'>*</p>
                </div>
                <div className="flex">
                  <input 
                    type="text" 
                    placeholder="0x123...45AB5" 
                    className="flex-1 p-3 border border-gray-300 rounded-l-lg"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    required
                  />
                  <button 
                    onClick={handleScanClick}
                    className="bg-gray-100 p-3 border border-l-0 border-gray-300 rounded-r-lg"
                  >
                    <Scan className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              {/* Network Fee */}
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Network Fee</span>
                  <span className="font-medium">~0.0001 ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Estimated Total</span>
                  <span className="font-medium">${(parseFloat(amount) + 0.01).toFixed(2)}</span>
                </div>
              </div>
              
              {/* Chain Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Network</span>
                  <span className="font-medium">Scroll Sepolia</span>
                </div>
              </div>
              
              {/* Send Button */}
              <button 
                className="mt-4 w-full bg-purple-600 text-white py-3 px-4 rounded-lg flex items-center justify-center"
                disabled={!recipientAddress}
              >
                <span className="mr-2">Send</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 