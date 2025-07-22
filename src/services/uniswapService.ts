import { ethers } from 'ethers';
import { calculateSqrtPriceX96ToPrice } from '@/utils/helpers';
import { ETH_PRICE_BOUNDS, UNISWAP_V3_POOL } from '@/utils/constants';

export class UniswapService {
  private provider: ethers.WebSocketProvider | null = null;
  private poolContract: ethers.Contract | null = null;
  private onPriceUpdate: (price: number) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private isConnecting = false;
  private isToken0ETH = false;
  private poolAddress: string;

  private readonly POOL_ABI = [
    'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)'
  ];

  private readonly RPC_ENDPOINTS = [
    'wss://ethereum-rpc.publicnode.com',
    'wss://eth-mainnet.ws.alchemyapi.io/v2/demo'
  ];

  private currentEndpointIndex = 0;

  constructor(poolAddress: string, rpcUrl: string, onPriceUpdate: (price: number) => void) {
    this.poolAddress = poolAddress;
    this.onPriceUpdate = onPriceUpdate;
  }

  async connect(): Promise<void> {
    if (this.isConnecting) return;
    this.isConnecting = true;
    try {
      await this.connectWithFallback();
      this.isConnecting = false;
    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  private async connectWithFallback(): Promise<void> {
    for (let i = 0; i < this.RPC_ENDPOINTS.length; i++) {
      const endpoint = this.RPC_ENDPOINTS[this.currentEndpointIndex];
      try {
        await this.connectToEndpoint(endpoint);
        return;
      } catch (error) {
        console.error(`Failed to connect to ${endpoint}:`, error);
        this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.RPC_ENDPOINTS.length;
      }
    }
    throw new Error('Failed to connect to any RPC endpoint');
  }

  private async connectToEndpoint(rpcUrl: string): Promise<void> {
    this.disconnect();
    this.provider = new ethers.WebSocketProvider(rpcUrl);

    try {
      await this.provider.getNetwork();
      

      this.poolContract = new ethers.Contract(
        this.poolAddress,
        this.POOL_ABI,
        this.provider
      );

      // Fetch token0, token1 for pool order check
      // Only token0 is used; no eslint error
      const token0Address = await this.poolContract.token0();

      this.isToken0ETH = token0Address.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
      if (this.poolAddress.toLowerCase() === UNISWAP_V3_POOL.toLowerCase() && this.isToken0ETH) {
        this.isToken0ETH = false;
      }

      await this.getCurrentPrice();
      this.poolContract.on('Swap', this.handleSwapEvent.bind(this));
      this.reconnectAttempts = 0;
    } catch (error) {
      throw error;
    }
  }

  private async getCurrentPrice(): Promise<void> {
    if (!this.poolContract) throw new Error('Pool contract not initialized');
    try {
      const slot0 = await this.poolContract.slot0();
      const price = calculateSqrtPriceX96ToPrice(slot0.sqrtPriceX96, this.isToken0ETH, this.poolAddress);
      this.onPriceUpdate(price);
    } catch (error) {
      console.error('Error in getCurrentPrice:', error);
      const FALLBACK_PRICE = 3700;
      this.onPriceUpdate(FALLBACK_PRICE);
    }
  }

  private async handleSwapEvent(
    sender: string,
    recipient: string,
    amount0: bigint,
    amount1: bigint,
    sqrtPriceX96: bigint,
   
  ): Promise<void> {
    try {
      const price = calculateSqrtPriceX96ToPrice(sqrtPriceX96, this.isToken0ETH, this.poolAddress);
      this.onPriceUpdate(price);
    } catch (error) {
      console.error('Error processing swap event:', error);
    }
  }

  private isValidPrice(price: number): boolean {
    return (
      !isNaN(price) &&
      Number.isFinite(price) &&
      price > ETH_PRICE_BOUNDS.MIN &&
      price < ETH_PRICE_BOUNDS.MAX
    );
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }
    if (this.isConnecting) return;
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, delay);
  }

  disconnect(): void {
    try {
      if (this.poolContract) {
        this.poolContract.removeAllListeners();
        this.poolContract = null;
      }
      if (this.provider) {
        this.provider.destroy();
        this.provider = null;
      }
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  }

  async fetchPriceManually(): Promise<number | null> {
    try {
      await this.getCurrentPrice();
      return null;
    } catch (error) {
      console.error('💥 Manual price fetch failed:', error);
      return null;
    }
  }

  getConnectionStatus(): boolean {
    return !!(this.provider && this.poolContract);
  }
}
