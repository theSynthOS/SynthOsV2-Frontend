import { ConnectButtonWrapper } from "../WalletProvider/ConnectButtonWrapper";

export function Header() {
  return (
    <header className="w-full border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="SynthOS Logo" className="h-8 w-8" />
          <span className="text-xl font-bold">SynthOS</span>
        </div>
        
        <ConnectButtonWrapper />
      </div>
    </header>
  );
} 