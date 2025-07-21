'use client';

import React from 'react';
import { useGasStore } from '@/store/gasStore';
import { GasCalculator } from '@/services/gasCalculator';
import { formatUSD, } from '@/utils/helpers';
import { Calculator, Zap } from 'lucide-react';
import { CHAIN_CONFIGS } from '@/utils/constants';

const SimulationPanel: React.FC = () => {
  const {
    mode,
    chains,
    usdPrice,
    simulationAmount,
    setSimulationAmount,
  } = useGasStore();

  // Simulation logic (unchanged)
  const simulations = React.useMemo(() => {
    if (
      mode !== 'simulation' ||
      !usdPrice ||
      isNaN(usdPrice) ||
      usdPrice <= 100 ||
      usdPrice > 10000
    ) {
      return [];
    }
    const results = GasCalculator.compareChains(simulationAmount, usdPrice, {
      ethereum: chains.ethereum,
      polygon: chains.polygon,
      arbitrum: chains.arbitrum,
    });
    return results.filter(
      simulation =>
        simulation.gasCostUSD > 0.0001 &&
        simulation.totalCostUSD > 0.0001 &&
        simulation.gasCostUSD < 1000 &&
        simulation.totalCostUSD < 1_000_000
    );
  }, [mode, simulationAmount, usdPrice, chains]);

  if (simulations.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
        <div className="text-center py-8">
          <Calculator className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">
            {mode !== 'simulation'
              ? 'Switch to Simulation Mode to calculate transaction costs'
              : `Error: Unable to calculate transaction costs. ${usdPrice > 10000 ? 'ETH price is too high.' : usdPrice <= 100 ? 'ETH price is too low.' : 'Invalid gas data.'}`}
          </p>
        </div>
      </div>
    );
  }

  const cheapestChain =
    simulations.length > 0
      ? simulations.reduce((min, current) =>
          current.totalCostUSD < min.totalCostUSD ? current : min
        )
      : null;

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center space-x-3 mb-6">
        <Calculator className="h-6 w-6 text-purple-400" />
        <h2 className="text-xl font-semibold">Transaction Simulator</h2>
      </div>

      {/* Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Transaction Amount
        </label>
        <div className="relative">
          <input
            type="number"
            value={simulationAmount}
            onChange={(e) => setSimulationAmount(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none no-spinner"
            placeholder="0.1"
            step="0.001"
            min="0"
          />
          <div className="absolute right-3 top-3 text-sm text-slate-400 pointer-events-none select-none">
            ETH/MATIC
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-300">Cost Comparison</h3>
        {simulations.map((simulation) => {
          const config = Object.values(CHAIN_CONFIGS).find(
            (c) => c.name === simulation.chain
          );
          const isCheapest =
            cheapestChain && simulation.chain === cheapestChain.chain;

          return (
            <div
              key={simulation.chain}
              className={`p-4 rounded-lg border ${
                isCheapest
                  ? 'border-green-400 bg-green-400/10'
                  : 'border-slate-600 bg-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config?.color }}
                  />
                  <span className="font-medium">{simulation.chain}</span>
                  {isCheapest && (
                    <span className="text-xs bg-green-400 text-green-900 px-2 py-1 rounded-full">
                      Cheapest
                    </span>
                  )}
                </div>
                <Zap className="h-4 w-4 text-slate-400" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-400">Gas Cost</p>
                  <p className="font-medium">
                    {isNaN(simulation.gasCostUSD)
                      ? '$0.00'
                      : formatUSD(simulation.gasCostUSD)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Total Cost</p>
                  <p className="font-semibold text-white">
                    {isNaN(simulation.totalCostUSD)
                      ? '$0.00'
                      : formatUSD(simulation.totalCostUSD)}
                  </p>
                </div>
              </div>
              {/* The "Gas: ..." row was completely removed here */}
            </div>
          );
        })}
      </div>
      {/* Summary */}
      {cheapestChain && simulations.length > 1 && (
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400 rounded-lg">
          <p className="text-sm text-blue-300">
            <strong>{cheapestChain.chain}</strong> is the most cost-effective
            option, saving you up to{' '}
            <strong>
              {formatUSD(
                Math.max(...simulations.map((s) => s.totalCostUSD)) -
                  cheapestChain.totalCostUSD
              )}
            </strong>{' '}
            compared to the most expensive option.
          </p>
        </div>
      )}
    </div>
  );
};

export default SimulationPanel;
