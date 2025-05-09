"use client"
import { scrollSepolia } from "@/client"
import { client } from "@/client"
import { ConnectButton } from "thirdweb/react"
import { wallets } from "./WalletProvider"


export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-4xl font-bold">
        SynthOS
      </div>

      <div className="text-2xl font-bold">
        Your gateway to the future of DeFi
      </div>

      <div className="w-20">
        <ConnectButton
        client={client}
        wallets={wallets}
        connectModal={{ size: "compact" }}
        accountAbstraction={{
          chain: scrollSepolia, // replace with the chain you want
          sponsorGas: true,
        }}
      />
      </div>
    </div>
  )
}
