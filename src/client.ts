// src/client.ts
import { createThirdwebClient, defineChain } from "thirdweb";

// Define Scroll Sepolia chain
export const scrollSepolia = defineChain({
  id: 534_351,
  name: "Scroll Sepolia",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://sepolia-rpc.scroll.io/"],
    },
    public: {
      http: ["https://sepolia-rpc.scroll.io/"],
    },
  },
  blockExplorers: {
    default: {
      name: "Scroll Sepolia Explorer",
      url: "https://sepolia-blockscout.scroll.io/",
    },
  },
  testnet: true,
});

// Create thirdweb client
export const client = createThirdwebClient({
  clientId: process.env.NEXT_THIRDWEB_CLIENT_ID || ''
});