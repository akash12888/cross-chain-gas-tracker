import { GasPoint, CandlestickData } from '@/types';
import { ETH_PRICE_BOUNDS, UNISWAP_V3_POOL } from '@/utils/constants';

export const formatGwei = (wei: number): string => {
  return (wei / 1e9).toFixed(2);
};

export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatETH = (wei: number): string => {
  return (wei / 1e18).toFixed(6);
};

/**
 * Converts Uniswap V3 sqrtPriceX96 to token price (USDC per ETH).
 * For ETH/USDC (ETH token0): price = (sqrtPriceX96^2 * 10^12) / 2^192
 * For USDC/ETH (USDC token0): price = 2^192 / (sqrtPriceX96^2 / 10^12)
 * @param sqrtPriceX96 The square root price from Uniswap V3 pool's slot0
 * @param isToken0ETH True if ETH is token0, false if USDC is token0
 * @param poolAddress The pool address for validation (optional)
 * @returns Price in USDC per ETH, or fallback price if calculation fails
 */
export const calculateSqrtPriceX96ToPrice = (
  sqrtPriceX96: bigint,
  isToken0ETH: boolean = false,
  poolAddress: string = ''
): number => {
  const FALLBACK_PRICE = 3700;
  
  
  // Decimal difference between ETH (18) and USDC (6) = 12 decimals = 10^12
  const DECIMAL_DIFF = BigInt(10) ** BigInt(12);
  const Q96_SQUARED = BigInt(2) ** BigInt(192); // 2^96 squared = 2^192

  if (sqrtPriceX96 <= 0) {
    console.error('❌ Invalid sqrtPriceX96:', sqrtPriceX96.toString());
    return FALLBACK_PRICE;
  }

  try {
    const priceSquared = sqrtPriceX96 * sqrtPriceX96;
    let price: number;

    if (isToken0ETH) {
      const numerator = priceSquared * DECIMAL_DIFF;
      price = Number(numerator) / Number(Q96_SQUARED);
    } else {
      const numerator = Q96_SQUARED * DECIMAL_DIFF;
      price = Number(numerator) / Number(priceSquared);
    }

    // Pool address check
    if (poolAddress.toLowerCase() === UNISWAP_V3_POOL.toLowerCase() && isToken0ETH) {
      // informational only; nothing to do
    }

    if (
      isNaN(price) ||
      !Number.isFinite(price) ||
      price < ETH_PRICE_BOUNDS.MIN ||
      price > ETH_PRICE_BOUNDS.MAX
    ) {
      console.error('❌ Calculated price out of valid range:', {
        price,
        sqrtPriceX96: sqrtPriceX96.toString(),
        isToken0ETH,
        poolAddress,
        minPrice: ETH_PRICE_BOUNDS.MIN,
        maxPrice: ETH_PRICE_BOUNDS.MAX
      });
      return FALLBACK_PRICE;
    }

    return price;

  } catch (error) {
    console.error('💥 Error in calculateSqrtPriceX96ToPrice:', error);
    return FALLBACK_PRICE;
  }
};

export const aggregateToCandlesticks = (
  gasPoints: GasPoint[],
  interval: number
): CandlestickData[] => {
  if (gasPoints.length === 0) return [];

  const candlesticks: CandlestickData[] = [];
  const sortedPoints = [...gasPoints].sort((a, b) => a.timestamp - b.timestamp);

  let currentInterval = Math.floor(sortedPoints[0].timestamp / interval) * interval;
  let intervalPoints: GasPoint[] = [];

  for (const point of sortedPoints) {
    const pointInterval = Math.floor(point.timestamp / interval) * interval;

    if (pointInterval === currentInterval) {
      intervalPoints.push(point);
    } else {
      if (intervalPoints.length > 0) {
        candlesticks.push(createCandlestick(currentInterval, intervalPoints));
      }
      currentInterval = pointInterval;
      intervalPoints = [point];
    }
  }

  if (intervalPoints.length > 0) {
    candlesticks.push(createCandlestick(currentInterval, intervalPoints));
  }

  return candlesticks;
};

const createCandlestick = (time: number, points: GasPoint[]): CandlestickData => {
  const fees = points.map(p => p.totalFee / 1e9); // Gwei
  return {
    time: time / 1000, // ms to seconds
    open: fees[0],
    high: Math.max(...fees),
    low: Math.min(...fees),
    close: fees[fees.length - 1],
  };
};

export function debounce<Args extends unknown[]>(
  func: (...args: Args) => void,
  wait: number
): (...args: Args) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
