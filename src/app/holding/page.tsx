"use client";
import Image from "next/image";
import { useActiveAccount } from "thirdweb/react";


export default function HoldingPage() {
  const account = useActiveAccount();

    // Format address to show first 6 and last 4 characters
  const formatAddress = (address: string | null) => {
    if (!address) return "Connect your wallet";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };


  return (
    <div>
        <div className="flex flex-col items-center h-screen p-4">
          {/* section 1 */}
          <div className="flex flex-col items-center justify-center border-b-1 border-gray-700 ">
            <Image src="/SynthOS-tranparent.png" alt="holding" width={100} height={100} className="w-30 h-30 rounded-full bg-gray-200/50"/>
            <div className="text-sm text-gray-400 truncate">
            {account && account.address ? formatAddress(account.address) : "Not connected"}
            <div className="flex items-center justify-between">
              <div>Deposit</div>
              <div>Withdraw</div>
              <div>Send</div>
            </div>
          </div>
          </div>

          {/* section 2 */}
          <div className="flex flex-col items-center justify-center">
            <div>
              Total Holding
            </div>
          </div>
        </div>
    </div>
  );
} 