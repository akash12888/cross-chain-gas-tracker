'use client';

import React from 'react';
import { useGasStore } from '@/store/gasStore';
import { formatGwei} from '@/utils/helpers';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CHAIN_CONFIGS } from '@/utils/constants';

interface GasWidgetProps {
  chain: keyof typeof CHAIN_CONFIGS;
}

const GasWidget: React.FC<GasWidgetProps> = ({ chain }) => {
  const { chains } = useGasStore();
  const chainData = chains[chain];
  const config = CHAIN_CONFIGS[chain];

  const getTrend = () => {
    if (chainData.history.length < 2) return 'neutral';
    const current = chainData.history[chainData.history.length - 1];
    const previous = chainData.history[chainData.history.length - 2];

    if (current.totalFee > previous.totalFee) return 'up';
    if (current.totalFee < previous.totalFee) return 'down';
    return 'neutral';
  };

  const trend = getTrend();
  const totalFee = chainData.baseFee + chainData.priorityFee;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-green-400' : 'text-gray-400';

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <h3 className="text-lg font-semibold">{config.name}</h3>
        </div>
        <TrendIcon className={`h-5 w-5 ${trendColor}`} />
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-slate-400">Total Fee</p>
          <p className="text-2xl font-bold" style={{ color: config.color }}>
            {formatGwei(totalFee)} gwei
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Base Fee</p>
            <p className="font-medium">{formatGwei(chainData.baseFee)} gwei</p>
          </div>
          <div>
            <p className="text-slate-400">Priority Fee</p>
            <p className="font-medium">{formatGwei(chainData.priorityFee)} gwei</p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700">
          <p className="text-xs text-slate-400">
            Last updated: {chainData.history.length > 0 ?
              new Date(chainData.history[chainData.history.length - 1].timestamp).toLocaleTimeString() :
              'Never'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default GasWidget;
