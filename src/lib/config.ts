const config = {
  SYNTHOS_AI_ANALYZER_URL:
    process.env.NODE_ENV === "production"
      ? "https://ai.synthos.fun"
      : "http://localhost:3000",
  // Backend URLs
  SYNTHOS_BACKEND_URL:
    process.env.NODE_ENV === "production"
      ? "https://backend.synthos.fun"
      : "http://localhost:8080",
} as const;

// API endpoint builders
export const apiEndpoints = {
  // AI Analyzer endpoints
  aiAnalyzer: (address: string) =>
    `${config.SYNTHOS_AI_ANALYZER_URL}/api/analyze/${address}`,

  // Account endpoints
  balance: (address: string) =>
    `${config.SYNTHOS_BACKEND_URL}/accounts/balance/${address}`,

  holdings: (address: string) =>
    `${config.SYNTHOS_BACKEND_URL}/accounts/holdings/${address}`,

  // Action endpoints
  deposit: () => `${config.SYNTHOS_BACKEND_URL}/action/deposit`,

  loopingDeposit: () => `${config.SYNTHOS_BACKEND_URL}/action/looping-deposit`,

  withdraw: () => `${config.SYNTHOS_BACKEND_URL}/action/withdraw`,

  withdrawTracking: () =>
    `${config.SYNTHOS_BACKEND_URL}/action/withdraw-with-tracking`,

  updateDepositTx: () =>
    `${config.SYNTHOS_BACKEND_URL}/action/update-deposit-transaction`,

  updateWithdrawTx: () =>
    `${config.SYNTHOS_BACKEND_URL}/action/update-withdraw-transaction`,

  // Protocol endpoints
  protocolPairs: () => `${config.SYNTHOS_BACKEND_URL}/protocol/protocol-pairs`,
  protocolPairsApy: () =>
    `${config.SYNTHOS_BACKEND_URL}/protocol/protocol-pairs-apy`,
  protocols: () => `${config.SYNTHOS_BACKEND_URL}/protocol/protocols`,
} as const;

export default config;
