import { 
  inAppWallet, 
  createWallet
} from "thirdweb/wallets";
import { scrollSepolia } from "../client";

export const wallets = [
  // In-app wallet with built-in auth methods
  inAppWallet({
    auth: {
      options: [
        "google",
        "apple",
        "email",
        "passkey",
        "x",
        "telegram",
      ],
    },
    smartAccount: {
      chain: scrollSepolia,
      sponsorGas: true,
    },
  }),
  // External wallets - using createWallet instead of direct imports
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  // WalletConnect v2 is included by default with most wallet connections
];