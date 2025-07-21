import { ethers } from 'ethers';
import { GasPoint } from '@/types';

export class ChainService {
  private provider: ethers.WebSocketProvider;
  private chainName: string;
  private onUpdate: (point: GasPoint) => void;
  private isConnected: boolean = false;

  constructor(rpcUrl: string, chainName: string, onUpdate: (point: GasPoint) => void) {
    this.provider = new ethers.WebSocketProvider(rpcUrl);
    this.chainName = chainName;
    this.onUpdate = onUpdate;
  }

  async connect(): Promise<void> {
    try {
      await this.provider.getNetwork();
      this.isConnected = true;

      this.provider.on('block', async (blockNumber) => {
        try {
          const block = await this.provider.getBlock(blockNumber, false);
          if (block) {
            const gasPoint = this.parseGasData(block);
            this.onUpdate(gasPoint);
          }
        } catch (error) {
          console.error(`Error fetching block for ${this.chainName}:`, error);
        }
      });

      // Get initial
      const latestBlock = await this.provider.getBlock('latest', false);
      if (latestBlock) {
        const gasPoint = this.parseGasData(latestBlock);
        this.onUpdate(gasPoint);
      }
    } catch (error) {
      console.error(`Failed to connect to ${this.chainName}:`, error);
      this.isConnected = false;
      throw error;
    }
  }

  private parseGasData(block: ethers.Block): GasPoint {
    const baseFee = Number(block.baseFeePerGas || 0n);
    const priorityFee = Math.max(baseFee * 0.1, 1e9); 
    return {
      timestamp: Date.now(),
      baseFee,
      priorityFee,
      totalFee: baseFee + priorityFee,
      blockNumber: block.number
    };
  }

  disconnect(): void {
    if (this.provider && this.isConnected) {
      this.provider.removeAllListeners();
      this.provider.destroy();
      this.isConnected = false;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}
