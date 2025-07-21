'use client';

import React from 'react';
import { useGasStore } from '@/store/gasStore';
import { CHAIN_CONFIGS } from '@/utils/constants';

const ChainSelector: React.FC = () => {
  const { selectedChain, setSelectedChain } = useGasStore();

  return (
    <div className="flex space-x-2">
      {Object.entries(CHAIN_CONFIGS).map(([key, config]) => (
        <button
          key={key}
          onClick={() => setSelectedChain(key as keyof typeof CHAIN_CONFIGS)}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            selectedChain === key
              ? 'text-white shadow-lg'
              : 'text-slate-400 bg-slate-700 hover:bg-slate-600'
          }`}
          style={selectedChain === key ? { backgroundColor: config.color } : {}}
        >
          {config.name}
        </button>
      ))}
    </div>
  );
};

export default ChainSelector;
