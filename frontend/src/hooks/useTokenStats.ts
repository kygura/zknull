import { useState, useEffect } from 'react';
import { ethers, formatUnits } from 'ethers';
import deployment from '../deployments/sepolia.json';

const TOKEN_ADDRESS = deployment.contracts.ZkNullToken;
// Use a reliable public RPC for Sepolia
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

const ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

export interface TokenStats {
  ticker: string;
  maxSupply: string;
  circulating: string;
  burnt: string;
  loading: boolean;
}

export function useTokenStats() {
  const [stats, setStats] = useState<TokenStats>({
    ticker: '$ZKN',
    maxSupply: '...',
    circulating: '...',
    burnt: '...',
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(TOKEN_ADDRESS, ABI, provider);

        // Fetch data in parallel
        const [symbol, decimals, currentSupply, maxSupply, burntDead, burntZero] = await Promise.all([
          contract.symbol(),
          contract.decimals(),
          contract.totalSupply(),
          contract.MAX_SUPPLY(),
          contract.balanceOf("0x000000000000000000000000000000000000dEaD"),
          contract.balanceOf("0x0000000000000000000000000000000000000000")
        ]);

        const totalBurnt = burntDead + burntZero;
        // In this context:
        // "Total Supply" in UI usually refers to Max Supply for capped tokens, or Current Supply.
        // The user's previous hardcoded "total_supply" was 10M (the cap).
        // "Circulating" is usually Current Supply - Burnt (and sometimes - team/locked, but we'll stick to simple definition).
        
        const formattedMaxSupply = Number(formatUnits(maxSupply, decimals)).toLocaleString();
        const formattedCirculating = Number(formatUnits(currentSupply - totalBurnt, decimals)).toLocaleString();
        const formattedBurnt = Number(formatUnits(totalBurnt, decimals)).toLocaleString();

        setStats({
          ticker: `$${symbol}`,
          maxSupply: formattedMaxSupply,
          circulating: formattedCirculating,
          burnt: formattedBurnt,
          loading: false
        });
      } catch (error) {
        console.error("Failed to fetch token stats:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}
