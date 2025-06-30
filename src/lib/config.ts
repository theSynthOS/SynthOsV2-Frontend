const config = {
  // Backend URLs
  SYNTHOS_AI_ANALYZER_URL:
    process.env.SYNTHOS_AI_ANALYZER_URL || "https://ai.synthos.fun",
  SYNTHOS_BACKEND_URL:
    process.env.SYNTHOS_BACKEND_URL || "https://backend.synthos.fun",
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

  // Protocol endpoints
  protocolPairs: () => `${config.SYNTHOS_BACKEND_URL}/protocol/protocol-pairs`,
  protocolPairsApy: () =>
    `${config.SYNTHOS_BACKEND_URL}/protocol/protocol-pairs-apy`,
  protocols: () => `${config.SYNTHOS_BACKEND_URL}/protocol/protocols`,
} as const;

export default config;
