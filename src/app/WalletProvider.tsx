import { inAppWallet } from "thirdweb/wallets";
import { scrollSepolia } from "../client";


export const wallets = [
  inAppWallet(
    // built-in auth methods
    {
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
    },
  ),
];