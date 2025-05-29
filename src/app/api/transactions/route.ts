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

// Helper to fetch token transfers for an address
async function fetchTokenTransfers(address: string, chainConfig: any) {
  const url = `${ETHERSCAN_MULTICHAIN_URL}?chainid=${chainConfig.chainId}&module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "1") return [];
  return data.result;
}

function inferTxTypeAndSummary(
  transfers: Array<{
    symbol: string;
    amount: number;
    direction: "debit" | "credit";
  }>
) {
  // Group by direction
  const debits = transfers.filter(
    (t: { direction: string }) => t.direction === "debit"
  );
  const credits = transfers.filter(
    (t: { direction: string }) => t.direction === "credit"
  );
  // Helper: is aToken
  const isAToken = (symbol: string) =>
    symbol.startsWith("a") && symbol.length > 3;

  // SUPPLY: ETH/token sent, aToken received
  if (
    debits.length === 1 &&
    credits.length === 1 &&
    !isAToken(debits[0].symbol) &&
    isAToken(credits[0].symbol)
  ) {
    return {
      txType: "Supply",
      summary: `Supplied ${debits[0].amount} ${debits[0].symbol} for ${credits[0].amount} ${credits[0].symbol}`,
    };
  }
  // WITHDRAW: aToken sent, ETH/token received
  if (
    debits.length === 1 &&
    credits.length === 1 &&
    isAToken(debits[0].symbol) &&
    !isAToken(credits[0].symbol)
  ) {
    return {
      txType: "Withdraw",
      summary: `Withdrew ${credits[0].amount} ${credits[0].symbol} by redeeming ${debits[0].amount} ${debits[0].symbol}`,
    };
  }
  // BORROW: aToken received, token received (no ETH/token sent)
  if (
    debits.length === 0 &&
    credits.length === 2 &&
    credits.some((c: { symbol: string }) => isAToken(c.symbol)) &&
    credits.some((c: { symbol: string }) => !isAToken(c.symbol))
  ) {
    const aTok = credits.find((c: { symbol: string }) => isAToken(c.symbol));
    const tok = credits.find((c: { symbol: string }) => !isAToken(c.symbol));
    if (aTok && tok) {
      return {
        txType: "Borrow",
        summary: `Borrowed ${tok.amount} ${tok.symbol} (collateral: ${aTok.amount} ${aTok.symbol})`,
      };
    }
  }
  // REPAY: token sent, aToken sent
  if (
    debits.length === 2 &&
    debits.some((d: { symbol: string }) => isAToken(d.symbol)) &&
    debits.some((d: { symbol: string }) => !isAToken(d.symbol))
  ) {
    const aTok = debits.find((d: { symbol: string }) => isAToken(d.symbol));
    const tok = debits.find((d: { symbol: string }) => !isAToken(d.symbol));
    if (aTok && tok) {
      return {
        txType: "Repay",
        summary: `Repaid ${tok.amount} ${tok.symbol} (burned ${aTok.amount} ${aTok.symbol})`,
      };
    }
  }
  // Fallback
  return {
    txType: "Unknown",
    summary: transfers
      .map(
        (t: { direction: string; amount: number; symbol: string }) =>
          `${t.direction === "debit" ? "-" : "+"}${t.amount} ${t.symbol}`
      )
      .join(", "),
  };
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
    // Fetch normal transactions
    const response = await fetch(
      `${ETHERSCAN_MULTICHAIN_URL}?chainid=${chainConfig.chainId}&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${ETHERSCAN_API_KEY}`
    );
    const data = await response.json();
    if (data.status !== "1") {
      throw new Error(data.message || "Failed to fetch transactions");
    }

    // Fetch token transfers for this address
    const tokenTransfers = await fetchTokenTransfers(address, chainConfig);

    // Filter transactions for AAVE V3 pools
    const filteredTransactions = data.result.filter((tx: any) => {
      const toAddress = tx.to?.toLowerCase();
      return AAVE_V3_POOLS.some((pool) => pool.toLowerCase() === toAddress);
    });

    // Transform the data to match our frontend interface
    const transformedTransactions = await Promise.all(
      filteredTransactions.map(async (tx: any) => {
        // ETH transfer
        let ethAmount =
          parseFloat(tx.value) / Math.pow(10, chainConfig.decimals);
        let transfers: Array<{
          asset: string;
          symbol: string;
          amount: number;
          direction: "debit" | "credit";
        }> = [];
        if (ethAmount > 0) {
          transfers.push({
            asset: "ETH",
            symbol: chainConfig.symbol,
            amount: ethAmount,
            direction: (tx.from.toLowerCase() === address.toLowerCase()
              ? "debit"
              : "credit") as "debit" | "credit",
          });
        }
        // Token transfers for this tx
        const tokenEvents = tokenTransfers.filter(
          (t: any) => t.hash === tx.hash
        );
        for (const t of tokenEvents) {
          transfers.push({
            asset: t.tokenName,
            symbol: t.tokenSymbol,
            amount: parseFloat(t.value) / Math.pow(10, t.tokenDecimal),
            direction: (t.from.toLowerCase() === address.toLowerCase()
              ? "debit"
              : "credit") as "debit" | "credit",
          });
        }
        const { txType, summary } = inferTxTypeAndSummary(transfers);
        return {
          id: tx.hash,
          protocolName: "AAVE",
          transfers,
          txType,
          summary,
          timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
          status: tx.isError === "0" ? "completed" : "failed",
          chain: "Scroll Sepolia",
          protocolLogo: "/aave-logo.png",
          walletAddress: tx.from,
        };
      })
    );

    // Calculate total amount (ETH only, for summary)
    const totalAmount = transformedTransactions.reduce((sum, tx) => {
      const eth = tx.transfers.find(
        (t: any) => t.symbol === chainConfig.symbol && t.direction === "debit"
      );
      return sum + (eth ? eth.amount : 0);
    }, 0);

    return NextResponse.json({
      transactions: transformedTransactions,
      metadata: {
        totalTransactions: transformedTransactions.length,
        totalSuccessful: transformedTransactions.filter(
          (tx: any) => tx.status === "completed"
        ).length,
        totalAmount,
        lastUpdated: new Date().toISOString(),
        chain: "Scroll Sepolia",
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
