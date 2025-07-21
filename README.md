Real-Time Cross-Chain Gas Price Tracker with Wallet Simulation
🚀 Overview
A modern, responsive Next.js dashboard for monitoring real-time gas prices across Ethereum, Polygon, and Arbitrum. This platform connects directly to on-chain WebSocket RPC endpoints—completely avoiding third-party APIs. It features an interactive simulation panel to visualize and compare the USD and native token costs of transactions across networks. Live ETH/USD pricing is sourced directly from Uniswap V3’s on-chain pool. A dynamic candlestick chart tracks 15-minute gas price volatility. Zustand manages all app state for smooth switching between live and simulation modes.

✨ Features
Live Gas Prices:
Track Ethereum, Polygon, and Arbitrum gas prices in real time using direct WebSocket connections (no APIs).

Wallet Simulation:
Enter any transaction amount and see instant cross-chain cost comparisons in both native tokens and USD—updated live.

Direct On-Chain Uniswap Pricing:
ETH/USD price is parsed directly from Uniswap V3’s on-chain pool; no Uniswap SDK or third-party price feeds needed.

Candlestick Charts:
Interactive charts display 15-minute aggregated gas price volatility for each supported network.

Modern Responsive UI:
Built from the ground up with Next.js and Tailwind CSS for a seamless experience on any device.

Seamless Live/Simulation State:
Zustand provides fast, global state management, enabling effortless toggling between live and simulation modes.

🗂️ Project Structure
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
🛠️ Getting Started
1. Clone & Install
  git clone https://github.com/akash12888/cross-chain-gas-tracker.git
  cd cross-chain-gas-tracker
  npm install
  # or
  yarn install
2. Run the App
  npm run dev
  # or
  yarn dev
Visit: http://localhost:3000

📚 Usage Guide
Live Mode:
Monitor live gas price data and Uniswap-based ETH/USD price updates in real time.

Simulation Mode:
Enter any amount (e.g., 0.5 ETH) and instantly see a table comparing the full transaction cost (gas + value) across all chains.

Visualization:
Switch between supported chains, explore interactive candlestick charts, and compare network volatility and transaction fees at a glance.

