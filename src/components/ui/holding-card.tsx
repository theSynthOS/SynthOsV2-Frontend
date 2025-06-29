import React, { useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { ArrowUp } from 'lucide-react';
import WithdrawModal from '@/components/features/withdraw-modal';

interface HoldingCardProps {
  symbol: string;
  name: string;
  amount: string;
  apy: string;
  logoUrl: string;
  onClick?: () => void;
  pool?: {
    name: string;
    apy: number;
    risk: string;
    pair_or_vault_name: string;
    protocol_id?: string;
    protocol_pair_id?: string;
  };
  balance?: string;
  address?: string;
  refreshBalance?: () => void;
}

const HoldingCard: React.FC<HoldingCardProps> = ({
  symbol,
  name,
  amount: amount,
  apy,
  logoUrl,
  onClick,
  pool,
  balance,
  address,
  refreshBalance
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  return (
    <>
      <div 
        className={`w-full max-w-md mx-auto rounded-2xl overflow-hidden border ${isDark ? 'bg-[#0B0424] border-white/30' : 'bg-[#F5F2FF] border-[#CECECE]'} shadow-md relative `} 
        style={{
          boxShadow: isDark 
            ? 'inset 0 0 20px rgba(143, 99, 233, 0.45)' 
            : 'inset 0 0 20px rgba(143, 99, 233, 0.2)'
        }}
      >
        {/* Radial blur effect */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 0% 0%, ${isDark ? 'rgba(143, 99, 233, 0.15)' : 'rgba(143, 99, 233, 0.2)'} 0%, transparent 50%)`,
          }}
        />
        
        <div className="p-4 flex flex-col relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 relative">
                <Image
                  src={logoUrl}
                  alt={`${symbol} logo`}
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <p className={`text-lg md:text-xl ${isDark ? 'text-white' : 'text-black'}`}>{symbol}</p>
                <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>({name})</p>
              </div>
            </div>
            <div className={`border border-[#C3C3C3] rounded-full px-2 py-2 flex items-center gap-1`}>
              <ArrowUp className="h-4 w-4 text-green-500" />
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>{apy}</span>
            </div>
          </div>
          <div className="text-center mb-4">
            <h2 className={`text-3xl ${isDark ? 'text-white' : 'text-black'}`}>${amount}</h2>
          </div>
        </div>
        <button 
          onClick={() => {
            if (pool && balance && address) {
              setShowWithdrawModal(true);
            } else if (onClick) {
              onClick();
            }
          }}
          className="w-full py-4 bg-[#8266E6] hover:bg-[#6A4DE0] transition-colors text-white font-medium text-lg relative z-10"
        >
          Withdraw
        </button>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && pool && balance && address && (
        <WithdrawModal
          pool={pool}
          onClose={() => setShowWithdrawModal(false)}
          balance={balance}
          address={address}
          refreshBalance={refreshBalance}
        />
      )}
    </>
  );
};

export default HoldingCard;
