'use client';

import React, { useEffect, useRef } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData as LWCandlestickData,
  CandlestickSeries
} from 'lightweight-charts';
import { useGasStore } from '@/store/gasStore';
import { aggregateToCandlesticks } from '@/utils/helpers';
import { CANDLESTICK_INTERVAL, CHAIN_CONFIGS } from '@/utils/constants';

const CandlestickChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  const { chains, selectedChain } = useGasStore();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: 1,
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#374151',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    // FIXED: Use CandlestickSeries definition, not a string literal
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: CHAIN_CONFIGS[selectedChain].color,
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: CHAIN_CONFIGS[selectedChain].color,
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries as ISeriesApi<'Candlestick'>;

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart) {
        chart.remove();
      }
    };
  }, [selectedChain]);

  useEffect(() => {
    if (!seriesRef.current) return;

    const chainData = chains[selectedChain];
    const candlestickData = aggregateToCandlesticks(chainData.history, CANDLESTICK_INTERVAL);

    if (candlestickData.length > 0) {
      // Lightweight-charts expects object matching CandlestickData
      seriesRef.current.setData(candlestickData as LWCandlestickData[]);
    }
  }, [chains, selectedChain]);

  return (
    <div className="w-full">
      <div ref={chartContainerRef} className="w-full h-[400px]" />
      <div className="mt-4 text-sm text-slate-400 text-center">
        Gas price volatility over 15-minute intervals for {CHAIN_CONFIGS[selectedChain].name}
      </div>
    </div>
  );
};

export default CandlestickChart;
