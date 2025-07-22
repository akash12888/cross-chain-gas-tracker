export const CHAIN_CONFIGS = {
  ethereum: {
    name: 'Ethereum',
    id: 1,
    rpcUrl: 'wss://0xrpc.io/eth',
    color: '#627EEA',
    symbol: 'ETH',
    gasLimit: 21000,
  },
  polygon: {
    name: 'Polygon',
    id: 137,
    rpcUrl: 'wss://polygon-bor-rpc.publicnode.com',
    color: '#8247E5',
    symbol: 'MATIC',
    gasLimit: 21000,
  },
  arbitrum: {
    name: 'Arbitrum',
    id: 42161,
    rpcUrl: 'wss://arbitrum-one-rpc.publicnode.com',
    color: '#28A0F0',
    symbol: 'ETH',
    gasLimit: 21000,
  },
};

// ETH/USDC 0.05% pool - most liquid
export const UNISWAP_V3_POOL = '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640';

// Alternative reliable RPC endpoints for Uniswap price fetching
export const ETHEREUM_RPC_ENDPOINTS = [
  'https://api.zan.top/eth-mainnet',
  'wss://ethereum-rpc.publicnode.com',
];

export const UPDATE_INTERVAL = 6000; // 6 seconds
export const HISTORY_LENGTH = 100; // Keep last 100 data points
export const CANDLESTICK_INTERVAL = 15 * 60 * 1000; // 15 minutes

export const ETH_PRICE_BOUNDS = {
  MIN: 500,
  MAX: 20000,
};
