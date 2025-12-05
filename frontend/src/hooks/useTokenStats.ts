import { useState, useEffect } from 'react';
import { ethers, formatUnits } from 'ethers';
import deployment from '../deployments/sepolia.json';

const TOKEN_ADDRESS = deployment.contracts.ZkNullToken;
// Use a reliable public RPC for Sepolia
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

// Configurable refresh interval (default: 2 hours)
// Set to lower values for testing: 60000 = 1 minute, 300000 = 5 minutes
const REFRESH_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours

const CACHE_KEY = 'zkn_token_stats';
const CACHE_TIMESTAMP_KEY = 'zkn_token_stats_timestamp';

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
  const [stats, setStats] = useState<TokenStats>(() => {
    // Try to load from cache on initial mount
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        // If cache is still fresh, use it
        if (age < REFRESH_INTERVAL_MS) {
          return { ...JSON.parse(cached), loading: false };
        }
      }
    } catch (error) {
      console.error("Failed to load cached stats:", error);
    }
    
    // Default state if no cache or cache expired
    return {
      ticker: '$ZKN',
      maxSupply: '...',
      circulating: '...',
      burnt: '...',
      loading: true
    };
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
        
        const formattedMaxSupply = Number(formatUnits(maxSupply, decimals)).toLocaleString();
        const formattedCirculating = Number(formatUnits(currentSupply - totalBurnt, decimals)).toLocaleString();
        const formattedBurnt = Number(formatUnits(totalBurnt, decimals)).toLocaleString();

        const newStats = {
          ticker: `$${symbol}`,
          maxSupply: formattedMaxSupply,
          circulating: formattedCirculating,
          burnt: formattedBurnt,
          loading: false
        };

        setStats(newStats);
        
        // Cache the results
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(newStats));
          localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        } catch (error) {
          console.error("Failed to cache stats:", error);
        }
      } catch (error) {
        console.error("Failed to fetch token stats:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    // Check if we need to fetch
    const shouldFetch = () => {
      try {
        const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        if (!timestamp) return true;
        
        const age = Date.now() - parseInt(timestamp);
        return age >= REFRESH_INTERVAL_MS;
      } catch {
        return true;
      }
    };

    // Fetch immediately if cache is stale
    if (shouldFetch()) {
      fetchStats();
    }
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      if (shouldFetch()) {
        fetchStats();
      }
    }, REFRESH_INTERVAL_MS);
    
    return () => clearInterval(interval);
  }, []);

  return stats;
}
