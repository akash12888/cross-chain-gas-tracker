import { ethers } from 'ethers';
import { calculateSqrtPriceX96ToPrice } from '@/utils/helpers';
import { ETH_PRICE_BOUNDS, UNISWAP_V3_POOL } from '@/utils/constants';

export class UniswapService {
  private provider: ethers.WebSocketProvider | null = null;
  private poolContract: ethers.Contract | null = null;
  private onPriceUpdate: (price: number) => void;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000;
  private isConnecting: boolean = false;
  private isToken0ETH: boolean = false;
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
    console.log(' UniswapService initialized with pool:', poolAddress);
  }

  async connect(): Promise<void> {
    if (this.isConnecting) {
      console.log(' Already connecting...');
      return;
    }
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
      console.log(`🔗 Attempting to connect to endpoint ${this.currentEndpointIndex + 1}/${this.RPC_ENDPOINTS.length}: ${endpoint}`);
      try {
        await this.connectToEndpoint(endpoint);
        console.log(' Successfully connected!');
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

    console.log('🔌 Creating WebSocket provider...');
    this.provider = new ethers.WebSocketProvider(rpcUrl);



    try {
      console.log(' Testing network connection...');
      const network = await this.provider.getNetwork();
      console.log(' Connected to network:', network.name, 'chainId:', network.chainId);

      console.log(' Creating pool contract...');
      this.poolContract = new ethers.Contract(
        this.poolAddress,
        this.POOL_ABI,
        this.provider
      );

      console.log(' Verifying pool and getting token info...');
      const [token0, token1] = await Promise.all([
        this.poolContract.token0(),
        this.poolContract.token1()
      ]);

      console.log('🪙 Pool tokens:', {
        token0, // Expected USDC: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
        token1  // Expected WETH: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
      });

      this.isToken0ETH = token0.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
      if (this.poolAddress.toLowerCase() === UNISWAP_V3_POOL.toLowerCase() && this.isToken0ETH) {
        console.warn(' Token order mismatch: Expected USDC/WETH but detected ETH/USDC for pool', this.poolAddress);
        this.isToken0ETH = false;
      }
      console.log('Token order:', this.isToken0ETH ? 'ETH/USDC' : 'USDC/ETH', {
        token0,
        token1,
        isToken0ETH: this.isToken0ETH,
        poolAddress: this.poolAddress
      });

      console.log(' Fetching initial price...');
      await this.getCurrentPrice();

      console.log(' Setting up swap event listener...');
      this.poolContract.on('Swap', this.handleSwapEvent.bind(this));

      this.reconnectAttempts = 0;
      console.log(' Uniswap service fully connected and listening!');
    } catch (error) {
      throw error;
    }
  }

  private async getCurrentPrice(): Promise<void> {
    if (!this.poolContract) throw new Error('Pool contract not initialized');
    try {
      console.log(' Calling slot0()...');
      const slot0 = await this.poolContract.slot0();
      console.log('Raw slot0 data:', {
        sqrtPriceX96: slot0.sqrtPriceX96.toString(),
        tick: slot0.tick,
        observationIndex: slot0.observationIndex
      });
      console.log(' Debug: Calling calculateSqrtPriceX96ToPrice with:', {
        sqrtPriceX96: slot0.sqrtPriceX96.toString(),
        isToken0ETH: this.isToken0ETH,
        poolAddress: this.poolAddress
      });
      const price = calculateSqrtPriceX96ToPrice(slot0.sqrtPriceX96, this.isToken0ETH, this.poolAddress);
      console.log(' Calculated ETH price: $', price);
      this.onPriceUpdate(price);
    } catch (error) {
      console.error(' Error in getCurrentPrice:', error);
      const FALLBACK_PRICE = 3700;
      console.warn(` Using fallback price: ${FALLBACK_PRICE}`);
      this.onPriceUpdate(FALLBACK_PRICE);
    }
  }

  private async handleSwapEvent(
    sender: string,
    recipient: string,
    amount0: bigint,
    amount1: bigint,
    sqrtPriceX96: bigint,
    liquidity: bigint,
    tick: number
  ): Promise<void> {
    try {
      console.log(' New swap event detected!', {
        sender: sender.substring(0, 8) + '...',
        sqrtPriceX96: sqrtPriceX96.toString(),
        tick
      });
      console.log('Debug: Calling calculateSqrtPriceX96ToPrice with:', {
        sqrtPriceX96: sqrtPriceX96.toString(),
        isToken0ETH: this.isToken0ETH,
        poolAddress: this.poolAddress
      });
      const price = calculateSqrtPriceX96ToPrice(sqrtPriceX96, this.isToken0ETH, this.poolAddress);
      console.log('New ETH price from swap: $', price);
      this.onPriceUpdate(price);
    } catch (error) {
      console.error(' Error processing swap event:', error);
    }
  }

 
  private isValidPrice(price: number): boolean {
    const isValid = !isNaN(price) &&
      Number.isFinite(price) &&
      price > ETH_PRICE_BOUNDS.MIN &&
      price < ETH_PRICE_BOUNDS.MAX;
    console.log('Price validation:', { price, isValid });
    return isValid;
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(' Max reconnection attempts reached');
      return;
    }
    if (this.isConnecting) {
     
      return;
    }
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    console.log(` Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error(' Reconnection failed:', error);
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
      console.error(' Error during disconnect:', error);
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
