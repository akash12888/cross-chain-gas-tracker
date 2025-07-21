# ⚡ Real-Time Cross-Chain Gas Price Tracker with Wallet Simulation

A sleek, responsive Next.js dashboard for monitoring **real-time gas prices** across **Ethereum, Polygon, and Arbitrum**. This tool uses **pure on-chain data** via WebSocket RPCs—**no third-party APIs**. It includes wallet simulation, candlestick charts, and Uniswap V3-based ETH/USD price tracking.

---

## 🚀 Features

- 🔴 **Live Gas Prices** via WebSocket (Ethereum, Polygon, Arbitrum)
- 💸 **Wallet Simulation** (cost in native + USD)
- 💱 **ETH/USD Price** directly from Uniswap V3 (on-chain logs)
- 📈 **15-min Candlestick Charts** with volatility insights
- 🖥️ **Modern UI** built with Tailwind + Zustand + Lightweight Charts
- 🌐 **Fully client-side** (Next.js 14 App Router)

---


---

## 🛠️ Getting Started

 
### 1. Clone & Install


git clone https://github.com/akash12888/cross-chain-gas-tracker.git
cd cross-chain-gas-tracker
npm install   
or yarn install

### 2. Start the Development Server

npm run dev  
or yarn dev
Open your browser at: http://localhost:3000

📚 How to Use
✅ Live Mode
View live gas prices (ETH, MATIC, ARB)

Real-time ETH/USD from Uniswap V3

Auto-refresh using WebSocket RPC streams

🧮 Simulation Mode
Input amount (e.g., 0.5 ETH)

Instantly view transaction cost per chain

See costs in both native tokens and USD

📊 Visualization
Interactive candlestick charts (15m aggregation)

Chain selector to compare volatility

Track fee spikes and dips

