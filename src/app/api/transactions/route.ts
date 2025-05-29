import { NextResponse } from "next/server";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ETHERSCAN_MULTICHAIN_URL = "https://api.etherscan.io/v2/api";

// AAVE V3 Pool Contracts
const AAVE_V3_POOLS = [
  "0x48914c788295b5db23af2b5f0b3be775c4ea9440",
  "0x57ce905cfd7f986a929a26b006f797d181db706e",
];

interface ChainConfig {
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  explorer: string;
}

const CHAIN_CONFIGS: { [key: string]: ChainConfig } = {
  scrollSepolia: {
    chainId: 534351,
    name: "Scroll Sepolia",
    symbol: "ETH",
    decimals: 18,
    explorer: "https://sepolia.scrollscan.com",
  },
};

// Helper to parse ERC-20 transfer input data
function parseERC20TransferInput(input: string) {
  // ERC-20 transfer: a9059cbb000000000000000000000000<to_address_32bytes><amount_32bytes>
  if (input && input.startsWith("0xa9059cbb") && input.length === 138) {
    const to = "0x" + input.slice(34, 74);
    const amountHex = input.slice(74);
    const amount = parseInt(amountHex, 16);
    return { to, amount };
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const chain = searchParams.get("chain") || "scrollSepolia";

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  const chainConfig = CHAIN_CONFIGS[chain];
  if (!chainConfig) {
    return NextResponse.json(
      { error: "Invalid chain specified" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${ETHERSCAN_MULTICHAIN_URL}?chainid=${chainConfig.chainId}&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${ETHERSCAN_API_KEY}`
    );

    const data = await response.json();

    if (data.status !== "1") {
      throw new Error(data.message || "Failed to fetch transactions");
    }

    // Filter transactions for AAVE V3 pools
    const filteredTransactions = data.result.filter((tx: any) => {
      const toAddress = tx.to?.toLowerCase();
      return AAVE_V3_POOLS.some((pool) => pool.toLowerCase() === toAddress);
    });

    // Transform the data to match our frontend interface
    const transformedTransactions = await Promise.all(
      filteredTransactions.map(async (tx: any) => {
        let asset = chainConfig.symbol;
        let amount = parseFloat(tx.value) / Math.pow(10, chainConfig.decimals);
        // If value is 0, check for ERC-20 transfer
        if (amount === 0 && tx.input && tx.input !== "0x") {
          const parsed = parseERC20TransferInput(tx.input);
          if (parsed) {
            // Try to get token symbol and decimals (optional, fallback to generic ERC-20)
            asset = "ERC20";
            // Optionally, fetch token details from chain if needed
            amount = parsed.amount / Math.pow(10, 18); // Default to 18 decimals
          }
        }
        return {
          id: tx.hash,
          protocolName: "AAVE",
          amount,
          asset,
          timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
          status: tx.isError === "0" ? "completed" : "failed",
          chain: chain,
          protocolLogo: "/aave-logo.png",
          walletAddress: tx.from,
        };
      })
    );

    return NextResponse.json({
      transactions: transformedTransactions,
      metadata: {
        totalTransactions: transformedTransactions.length,
        totalSuccessful: transformedTransactions.filter(
          (tx: any) => tx.status === "completed"
        ).length,
        totalAmount: transformedTransactions.reduce(
          (sum: number, tx: any) => sum + tx.amount,
          0
        ),
        lastUpdated: new Date().toISOString(),
        chain: chain,
        symbol: chainConfig.symbol,
        explorer: chainConfig.explorer,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
