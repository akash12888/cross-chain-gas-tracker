import { create } from 'zustand';
import { GasState } from '@/types';
import { CHAIN_CONFIGS, HISTORY_LENGTH } from '@/utils/constants';

export const useGasStore = create<GasState>((set, get) => ({
  mode: 'live',
  chains: {
    ethereum: {
      ...CHAIN_CONFIGS.ethereum,
      baseFee: 0,
      priorityFee: 0,
      history: []
    },
    polygon: {
      ...CHAIN_CONFIGS.polygon,
      baseFee: 0,
      priorityFee: 0,
      history: []
    },
    arbitrum: {
      ...CHAIN_CONFIGS.arbitrum,
      baseFee: 0,
      priorityFee: 0,
      history: []
    }
  },
  usdPrice: 0,
  simulationAmount: '0.1',
  selectedChain: 'ethereum',
  isConnected: false,
  lastUpdate: Date.now(),

  setMode: (mode) => set({ mode }),

  updateChainData: (chain, data) =>
    set((state) => ({
      chains: {
        ...state.chains,
        [chain]: { ...state.chains[chain], ...data }
      },
      lastUpdate: Date.now()
    })),

  setUsdPrice: (usdPrice) => {
    // More lenient validation - ETH price can range from $500 to $20,000
    const isValidPrice = !isNaN(usdPrice) && 
                        usdPrice > 500 && 
                        usdPrice < 20000 && 
                        Number.isFinite(usdPrice);
    
    if (isValidPrice) {
      console.log('✅ Setting valid usdPrice:', usdPrice);
      set({ usdPrice });
    } else {
      console.warn('⚠️ Invalid usdPrice received:', usdPrice, 'keeping current price');
      // Don't set fallback immediately, keep trying to get real price
      const currentPrice = get().usdPrice;
      if (currentPrice === 0) {
        // Only use fallback if no price has been set yet
        console.log('🔄 Using fallback price: $3700');
        set({ usdPrice: 3700 });
      }
    }
  },

  setSimulationAmount: (simulationAmount) => set({ simulationAmount }),

  setSelectedChain: (selectedChain) => set({ selectedChain }),

  addGasPoint: (chain, point) =>
    set((state) => {
      const currentHistory = state.chains[chain].history;
      const newHistory = [...currentHistory, point]
        .slice(-HISTORY_LENGTH)
        .sort((a, b) => a.timestamp - b.timestamp);

      return {
        chains: {
          ...state.chains,
          [chain]: {
            ...state.chains[chain],
            history: newHistory,
            baseFee: point.baseFee,
            priorityFee: point.priorityFee
          }
        },
        lastUpdate: Date.now()
      };
    }),

  setConnected: (isConnected) => set({ isConnected })
}));