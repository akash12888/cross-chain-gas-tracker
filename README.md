Real-Time Cross-Chain Gas Price Tracker with Wallet Simulation
Overview
A Next.js dashboard for tracking real-time gas prices on Ethereum, Polygon, and Arbitrum. The dashboard connects directly to native WebSocket RPC endpoints—no third-party APIs—for on-chain data, including base and priority gas fees. It parses the live ETH/USD price from Uniswap V3’s on-chain pool and features an interactive simulation panel, letting you compare the cost of sending crypto across chains in USD and native tokens. Candlestick charts visualize 15-min gas price volatility intervals. All state management is handled by Zustand for seamless operation in both live and simulation modes.

Features
Live gas prices for Ethereum, Polygon, and Arbitrum (direct via native RPC, not APIs)

Wallet simulation: Enter any transaction amount and instantly compare cost across chains in both native token and USD

Direct on-chain Uniswap price: ETH/USD updated in real time from Uniswap V3 (no Uniswap SDK)

Candlestick charts: 15-minute aggregated gas price volatility for each chain

Modern, responsive UI: Built with Next.js and Tailwind CSS

Seamless mode switching: Zustand manages shared live and simulation state

Project Structure
text
src/
├── app/
│   ├── favicon.ico         # Dashboard favicon
│   ├── globals.css         # Tailwind/global CSS
│   ├── layout.tsx          # Root layout wrapper
│   └── page.tsx            # Main dashboard page
├── components/
│   ├── CandleStickChart.tsx
│   ├── ChainSelector.tsx
│   ├── Dashboard.tsx
│   ├── Gaswidget.tsx
│   └── SimulationPanel.tsx
├── services/
│   ├── chainService.ts     # Blockchain/WebSocket logic
│   ├── gasCalculator.ts    # Cross-chain gas fee calculations
│   └── uniswapService.ts   # Uniswap V3 price parsing
├── store/
│   └── gasStore.ts         # Zustand global store
├── types/
│   └── index.ts            # TypeScript type definitions
├── utils/
│   ├── constants.ts
│   └── helpers.ts
Getting Started
1. Clone and Install
bash
git clone https://github.com/akash12888/cross-chain-gas-tracker.git
cd cross-chain-gas-tracker
npm install
# or
yarn install

2. Run the App
bash
npm run dev
# or
yarn dev
Visit http://localhost:3000.

Usage
Live Mode: Monitor on-chain gas price and Uniswap-based ETH/USD price updates in real time.

Simulation Mode: Enter an amount (e.g., 0.5 ETH) to instantly see cross-chain transaction cost breakdowns.

Visualization: Switch between chains, explore candlestick charts, and compare volatility and network fees.