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
export const calculateSqrtPriceX96ToPrice = (sqrtPriceX96: bigint, isToken0ETH: boolean = false, poolAddress: string = ''): number => {
  const FALLBACK_PRICE = 3700;
  const EXPECTED_USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const EXPECTED_WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  
  // Decimal difference between ETH (18) and USDC (6) = 12 decimals = 10^12
  const DECIMAL_DIFF = BigInt(10) ** BigInt(12);
  const Q96_SQUARED = BigInt(2) ** BigInt(192); // 2^96 squared = 2^192

  console.log('🔍 Debug: Starting price calculation with:', {
    sqrtPriceX96: sqrtPriceX96.toString(),
    isToken0ETH,
    poolAddress,
    DECIMAL_DIFF: DECIMAL_DIFF.toString(),
    Q96_SQUARED: Q96_SQUARED.toString()
  });

  if (sqrtPriceX96 <= 0) {
    console.error('❌ Invalid sqrtPriceX96:', sqrtPriceX96.toString());
    console.warn(`⚠️ Using fallback price: ${FALLBACK_PRICE}`);
    return FALLBACK_PRICE;
  }

  try {
    // Calculate sqrtPriceX96^2
    const priceSquared = sqrtPriceX96 * sqrtPriceX96;
    let price: number;

    // Let's first try to understand what a reasonable sqrtPriceX96 should be
    // For ETH price of ~$3700, and USDC/ETH pool:
    // sqrtPrice should be around sqrt(1/3700) * sqrt(10^12) * 2^96
    const expectedSqrtForUSDCETH = Math.sqrt(1/3700) * Math.sqrt(1e12) * Math.pow(2, 96);
    const expectedSqrtForETHUSDC = Math.sqrt(3700/1e12) * Math.pow(2, 96);
    
    console.log('🔍 Expected sqrtPriceX96 values:', {
      current: sqrtPriceX96.toString(),
      expectedForUSDCETH: expectedSqrtForUSDCETH.toString(),
      expectedForETHUSDC: expectedSqrtForETHUSDC.toString(),
      currentAsNumber: Number(sqrtPriceX96)
    });

    if (isToken0ETH) {
      // ETH/USDC pool: price = (sqrtPriceX96^2 * 10^12) / 2^192
      // This gives us USDC per ETH directly
      const numerator = priceSquared * DECIMAL_DIFF;
      price = Number(numerator) / Number(Q96_SQUARED);
      
      console.log('🔍 ETH/USDC calculation:', {
        priceSquared: priceSquared.toString(),
        numerator: numerator.toString(),
        price
      });
    } else {
      // USDC/ETH pool: sqrtPrice represents sqrt(USDC/ETH)
      // We want ETH price in USDC, so we need to invert the ratio
      // price = (2^192 * 10^12) / sqrtPriceX96^2
      const numerator = Q96_SQUARED * DECIMAL_DIFF;
      price = Number(numerator) / Number(priceSquared);
      
      console.log('🔍 USDC/ETH calculation:', {
        priceSquared: priceSquared.toString(),
        numerator: numerator.toString(),
        price,
        // Let's also check if we're in the right ballpark
        priceCheck: Number(numerator) / Number(priceSquared)
      });
    }

    // Warn if token order seems inconsistent with known pool
    if (poolAddress.toLowerCase() === UNISWAP_V3_POOL.toLowerCase() && isToken0ETH) {
      console.warn('⚠️ Unexpected token order: isToken0ETH = true for USDC/WETH pool', {
        poolAddress,
        expectedToken0: EXPECTED_USDC_ADDRESS,
        expectedToken1: EXPECTED_WETH_ADDRESS
      });
    }

    // Validate price range
    if (isNaN(price) || !Number.isFinite(price) || price < ETH_PRICE_BOUNDS.MIN || price > ETH_PRICE_BOUNDS.MAX) {
      console.error('❌ Calculated price out of valid range:', {
        price,
        sqrtPriceX96: sqrtPriceX96.toString(),
        isToken0ETH,
        poolAddress,
        minPrice: ETH_PRICE_BOUNDS.MIN,
        maxPrice: ETH_PRICE_BOUNDS.MAX
      });
      console.warn(`⚠️ Using fallback price: ${FALLBACK_PRICE}`);
      return FALLBACK_PRICE;
    }

    console.log('✅ Successfully calculated ETH price: $', price.toFixed(2));
    return price;
    
  } catch (error) {
    console.error('💥 Error in calculateSqrtPriceX96ToPrice:', error);
    console.warn(`⚠️ Using fallback price: ${FALLBACK_PRICE}`);
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

// 🟢 Converts wei to Gwei for charting candlesticks
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};