"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield, Wallet, CheckCircle } from "lucide-react"
import { ConnectButton } from "thirdweb/react"
import { client, scrollSepolia } from "@/lib/thirdweb"
import { isLoggedIn, login, generatePayload, logout } from "@/app/actions/login"

export default function CreateWalletPage() {
  const router = useRouter()

  // Redirect to home if already logged in
  useEffect(() => {
    const checkLogin = async () => {
      const loggedIn = await isLoggedIn()
      if (loggedIn) {
        router.replace("/")
      }
    }
    checkLogin()
  }, [router])

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0b22] text-white">
      {/* Status Bar - Simplified */}
      <div className="h-6"></div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-400/20 mb-4">
              <Wallet className="h-10 w-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Create Smart Wallet</h1>
            <p className="text-gray-400">Set up your wallet to start exploring DeFi protocols and earning yields</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-gray-800/50 rounded-lg p-4 flex items-start">
              <Shield className="h-6 w-6 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Secure & Non-custodial</h3>
                <p className="text-sm text-gray-400">
                  Your wallet is secured by advanced encryption and only you have access to your funds
                </p>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 flex items-start">
              <CheckCircle className="h-6 w-6 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Easy to Use</h3>
                <p className="text-sm text-gray-400">
                  No seed phrases to remember. Your wallet is linked to this device securely
                </p>
              </div>
            </div>
          </div>

          <div className="w-full tw-connect-wallet">
            <ConnectButton
              connectButton={{
                label: "Create Wallet",
              }}
              connectModal={{
                showThirdwebBranding: false,
                title: "Welcome to SynthOS - Create Your Account",
                titleIcon: "/logo.png",
                size: "compact",
                welcomeScreen: {
                  title: "Welcome to SynthOS",
                  subtitle: "Let's create your account to get started with DeFi",
                  img: {
                    src: "/logo.png",
                    width: 150,
                    height: 150,
                  },
                },
              }}
              auth={{
                isLoggedIn: async (address: string) => await isLoggedIn(),
                doLogin: async (params: any) => { await login(params); },
                getLoginPayload: async ({ address }: { address: string }) =>
                  generatePayload({ address, chainId: scrollSepolia.id }),
                doLogout: async () => { await logout(); },
              }}
              client={client}
              accountAbstraction={{
                chain: scrollSepolia,
                sponsorGas: true,
              }}
              appMetadata={{
                name: "SynthOS",
                description: "Scroll's #1 Verifiable DeFAI Agent Marketplace",
                url: "https://synthos.fun",
                logoUrl: "/logo.png",
              }}
              autoConnect={true}
              chain={scrollSepolia}
              onConnect={(wallet) => {
                router.replace("/")
              }}
            />
          </div>

          <p className="text-xs text-center text-gray-400 mt-4">
            By creating a wallet, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
} 