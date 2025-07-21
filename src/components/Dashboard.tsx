'use client';

import React, { useEffect } from 'react';
import { useGasStore } from '@/store/gasStore';
import { ChainService } from '@/services/chainService';
import { UniswapService } from '@/services/uniswapService';
import { CHAIN_CONFIGS, UNISWAP_V3_POOL } from '@/utils/constants';
import GasWidget from './Gaswidget';
import SimulationPanel from './SimulationPanel';
import CandlestickChart from './CandleStickChart';
import ChainSelector from './ChainSelector';
import { Activity, Zap, DollarSign } from 'lucide-react';

const Dashboard: React.FC = () => {
  const {
    mode,
    usdPrice,
    isConnected,
    setMode,
    addGasPoint,
    setUsdPrice,
    setConnected
  } = useGasStore();

  useEffect(() => {
    let chainServices: ChainService[] = [];
    let uniswapService: UniswapService | null = null;

    const initializeServices = async () => {
      try {
        const ethereumService = new ChainService(
          CHAIN_CONFIGS.ethereum.rpcUrl,
          'ethereum',
          (point) => addGasPoint('ethereum', point)
        );
        const polygonService = new ChainService(
          CHAIN_CONFIGS.polygon.rpcUrl,
          'polygon',
          (point) => addGasPoint('polygon', point)
        );
        const arbitrumService = new ChainService(
          CHAIN_CONFIGS.arbitrum.rpcUrl,
          'arbitrum',
          (point) => addGasPoint('arbitrum', point)
        );
        chainServices = [ethereumService, polygonService, arbitrumService];

        uniswapService = new UniswapService(
          UNISWAP_V3_POOL,
          CHAIN_CONFIGS.ethereum.rpcUrl,
          setUsdPrice
        );

        await Promise.all([
          ...chainServices.map(service => service.connect()),
          uniswapService.connect()
        ]);

        setConnected(true);
      } catch (error) {
        console.error('Failed to initialize services:', error);
        setConnected(false);
      }
    };

    initializeServices();

    return () => {
      chainServices.forEach(service => service.disconnect());
      if (uniswapService) {
        uniswapService.disconnect();
      }
    };
  }, [addGasPoint, setUsdPrice, setConnected]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Zap className="h-8 w-8 text-yellow-400" />
              <h1 className="text-3xl font-bold">Cross-Chain Gas Tracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-sm">ETH: ${usdPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex space-x-4">
            <button
              onClick={() => setMode('live')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                mode === 'live'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Activity className="inline-block w-4 h-4 mr-2" />
              Live Mode
            </button>
            <button
              onClick={() => setMode('simulation')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                mode === 'simulation'
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Simulation Mode
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gas Widgets */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GasWidget chain="ethereum" />
              <GasWidget chain="polygon" />
              <GasWidget chain="arbitrum" />
            </div>

            {/* Chart */}
            <div className="bg-slate-800/50 rounded-xl p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Gas Price Volatility</h2>
                <ChainSelector />
              </div>
              <CandlestickChart />
            </div>
          </div>

          {/* Simulation Panel */}
          <div className="lg:col-span-1">
            <SimulationPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
