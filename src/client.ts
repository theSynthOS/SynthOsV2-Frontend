// src/client.ts
import { createThirdwebClient, defineChain } from "thirdweb";
import { inAppWallet, createWallet } from "thirdweb/wallets";

// Create thirdweb client
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

export const wallets = [
   inAppWallet({
    auth: {
      options: [
        "google",
        "discord",
        "telegram",
        "email",
        "x",
      ],
    },
  }),
];

// // Define Scroll Sepolia chain
// export const scrollSepolia = defineChain({
//   id: 534_351,
//   name: "Scroll Sepolia",
//   nativeCurrency: {
//     name: "Ether",
//     symbol: "ETH",
//     decimals: 18,
//   },
//   rpcUrls: {
//     default: {
//       http: ["https://sepolia-rpc.scroll.io/"],
//     },
//     public: {
//       http: ["https://sepolia-rpc.scroll.io/"],
//     },
//   },
//   blockExplorers: {
//     default: {
//       name: "Scroll Sepolia Explorer",
//       url: "https://sepolia-blockscout.scroll.io/",
//     },
//   },
//   testnet: true,
// });

// // Define Ethereum mainnet chain
// export const ethereum = defineChain({
//   id: 1,
//   name: "Ethereum",
//   nativeCurrency: {
//     name: "Ether",
//     symbol: "ETH",
//     decimals: 18,
//   },
//   rpcUrls: {
//     default: {
//       http: ["https://eth.llamarpc.com"],
//     },
//     public: {
//       http: ["https://eth.llamarpc.com"],
//     },
//   },
//   blockExplorers: {
//     default: {
//       name: "Etherscan",
//       url: "https://etherscan.io",
//     },
//   },
//   testnet: false,
// });

