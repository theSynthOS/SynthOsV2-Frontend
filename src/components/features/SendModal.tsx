import { useState } from 'react';
import { X } from 'lucide-react';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendModal({ isOpen, onClose }: SendModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200); // Match animation duration
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      ></div>
      
      {/* Modal Content */}
      <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-xl ${isClosing ? 'animate-slide-down' : 'animate-slide-up'} h-[90%] z-50`}>
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-4"></div>
        
        {/* Close Button */}
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
        >
          <X className="h-6 w-6" />
        </button>
        
        {/* Modal Content */}
        <div className="p-6 pb-20">
          <h2 className="text-2xl font-bold mb-6">Send Funds</h2>
          
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-500">
              Enter recipient address and amount to send.
            </p>
            
            <div className="mt-4 text-left space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Address
                </label>
                <input 
                  type="text" 
                  placeholder="0x..." 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <button className="mt-2 w-full bg-purple-600 text-white py-2 px-4 rounded-lg">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 