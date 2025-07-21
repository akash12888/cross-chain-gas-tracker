export interface GasPoint {
  timestamp: number;
  baseFee: number;
  priorityFee: number;
  totalFee: number;
  blockNumber: number;
}

export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ChainData {
  name: string;
  id: number;
  baseFee: number;
  priorityFee: number;
  history: GasPoint[];
  rpcUrl: string;
  color: string;
  symbol: string;
}

export interface GasState {
  mode: 'live' | 'simulation';
  chains: {
    ethereum: ChainData;
    polygon: ChainData;
    arbitrum: ChainData;
  };
  usdPrice: number;
  simulationAmount: string;
  selectedChain: keyof GasState['chains'];
  isConnected: boolean;
  lastUpdate: number;

  // Actions
  setMode: (mode: 'live' | 'simulation') => void;
  updateChainData: (chain: keyof GasState['chains'], data: Partial<ChainData>) => void;
  setUsdPrice: (price: number) => void;
  setSimulationAmount: (amount: string) => void;
  setSelectedChain: (chain: keyof GasState['chains']) => void;
  addGasPoint: (chain: keyof GasState['chains'], point: GasPoint) => void;
  setConnected: (connected: boolean) => void;
}

export interface SimulationResult {
 chain: string;
  gasLimit: number;
  gasCostWei: number;
  gasCostETH: number;
  gasCostUSD: number;
  transactionValueUSD: number;
  totalCostUSD: number;
}
