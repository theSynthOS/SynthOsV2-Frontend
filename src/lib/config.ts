const config = {
  // Backend URLs
  SYNTHOS_BACKEND_V2_URL:
    process.env.SYNTHOS_BACKEND_V2_URL ||
    "https://synthos-v2-backend-production-f721.up.railway.app",
  SYNTHOS_BACKEND_URL:
    process.env.SYNTHOS_BACKEND_URL ||
    "https://synthos-backend-production.up.railway.app",
} as const;

// API endpoint builders
export const apiEndpoints = {
  // AI Analyzer endpoints
  aiAnalyzer: (address: string) =>
    `${config.SYNTHOS_BACKEND_V2_URL}/api/analyze/${address}`,

  // Account endpoints
  balance: (address: string) =>
    `${config.SYNTHOS_BACKEND_URL}/accounts/balance/${address}`,

  holdings: (address: string) =>
    `${config.SYNTHOS_BACKEND_URL}/accounts/holdings/${address}`,

  // Action endpoints
  deposit: () => `${config.SYNTHOS_BACKEND_URL}/action/deposit`,

  loopingDeposit: () => `${config.SYNTHOS_BACKEND_URL}/action/looping-deposit`,

  withdraw: () => `${config.SYNTHOS_BACKEND_URL}/action/withdraw`,

  // Protocol endpoints
  protocolPairs: () => `${config.SYNTHOS_BACKEND_URL}/protocol/protocol-pairs`,
  protocolPairsApy: () =>
    `${config.SYNTHOS_BACKEND_URL}/protocol/protocol-pairs-apy`,
  protocols: () => `${config.SYNTHOS_BACKEND_URL}/protocol/protocols`,
} as const;

export default config;
