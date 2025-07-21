import { SimulationResult } from '@/types';
import { CHAIN_CONFIGS } from '@/utils/constants';

export class GasCalculator {
  static calculateTransactionCost(
    chainKey: keyof typeof CHAIN_CONFIGS,
    amount: string,
    baseFee: number,         
    priorityFee: number,   
    ethPrice: number
  ): SimulationResult {
    const chain = CHAIN_CONFIGS[chainKey];
    const gasLimit = chain.gasLimit;

    const totalGasPriceWei = baseFee + priorityFee;
    const gasCostWei = totalGasPriceWei * gasLimit;
    const gasCostETH = gasCostWei / 1e18;
    const gasCostUSD = gasCostETH * ethPrice;

    const transactionValue = parseFloat(amount) || 0;
    const transactionValueUSD = transactionValue * ethPrice;
    const totalCostUSD = transactionValueUSD + gasCostUSD;

    console.log('🔍 Debug Gas Calc:', {
      chain,
      gasCostWei,
      gasCostETH,
      gasCostUSD,
      transactionValueUSD,
      totalCostUSD
    });

    return {
      chain: chain.name,
      gasLimit,
      gasCostWei,
      gasCostETH,
      gasCostUSD,
      transactionValueUSD,
      totalCostUSD
    };
  }

  static compareChains(
    amount: string,
    ethPrice: number,
    chainData: {
      ethereum: { baseFee: number; priorityFee: number };
      polygon: { baseFee: number; priorityFee: number };
      arbitrum: { baseFee: number; priorityFee: number };
    }
  ): SimulationResult[] {
    return [
      this.calculateTransactionCost('ethereum', amount, chainData.ethereum.baseFee, chainData.ethereum.priorityFee, ethPrice),
      this.calculateTransactionCost('polygon', amount, chainData.polygon.baseFee, chainData.polygon.priorityFee, ethPrice),
      this.calculateTransactionCost('arbitrum', amount, chainData.arbitrum.baseFee, chainData.arbitrum.priorityFee, ethPrice)
    ];
  }
}
