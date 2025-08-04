import { parseUnits } from "viem";

// Token details for Scroll Mainnet
export const TOKENS = {
  USDC: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    address: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4", // Scroll Mainnet USDC address
    logoUrl: "/usdc.png",
  },
  USDT: {
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    address: "0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df", // Scroll Mainnet USDT address
    logoUrl: "/usdt.png",
  },
};

export type TokenType = "USDC" | "USDT";

/**
 * Send tokens using smart wallet client
 */
export async function sendTokenTransaction(
  smartWalletClient: any,
  tokenType: TokenType,
  recipient: string,
  amount: string
) {
  const tokenConfig = TOKENS[tokenType];
  
  // Convert amount to wei (both USDC and USDT have 6 decimals)
  const amountInWei = parseUnits(amount, tokenConfig.decimals);

  // Create the transaction data for ERC20 transfer
  const transferData = `0xa9059cbb${recipient
    .slice(2)
    .padStart(64, "0")}${amountInWei.toString(16).padStart(64, "0")}`;

  // Send transaction using smart wallet client
  return await smartWalletClient.sendTransaction({
    to: tokenConfig.address,
    data: transferData as `0x${string}`,
  });
}

/**
 * Send ETH using smart wallet client
 */
export async function sendEthTransaction(
  smartWalletClient: any,
  recipient: string,
  amount: string
) {
  // Convert amount to wei (ETH has 18 decimals)
  const amountInWei = parseUnits(amount, 18);

  // Send transaction using smart wallet client
  return await smartWalletClient.sendTransaction({
    to: recipient,
    value: amountInWei,
  });
}

/**
 * Get wallet ID for API calls (prefer smart wallet, fallback to embedded)
 */
export function getWalletId(user: any): string | null {
  // Get smart wallet address from linkedAccounts
  const smartAccount = user?.linkedAccounts?.find((acc: any) => acc.type === 'smart_wallet');
  const smartWalletAddress = smartAccount?.address;
  
  // Prefer smart wallet address, fallback to embedded wallet
  return smartWalletAddress || user?.wallet?.id || user?.wallet?.address || null;
}

/**
 * Get display address (prefer smart wallet, fallback to embedded)
 */
export function getDisplayAddress(user: any): string | null {
  // Get smart wallet address from linkedAccounts
  const smartAccount = user?.linkedAccounts?.find((acc: any) => acc.type === 'smart_wallet');
  const smartWalletAddress = smartAccount?.address;
  
  // Prefer smart wallet address, fallback to embedded wallet
  return smartWalletAddress || user?.wallet?.address || null;
} 