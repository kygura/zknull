import { useState, useCallback } from 'react';
import { parseEther, formatEther, BrowserProvider, Contract } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { decomposeAmount } from '../utils/decomposition';
import { getPrivacyRouterAddress, getPrivacyRouterContract } from '../lib/contracts';
import { generateNote } from '../utils/crypto';

export function useFees() {
  const { account } = useWallet();
  const [fees, setFees] = useState({
    gas: '0',
    total: '0',
    loading: false,
    error: null as string | null
  });

  const estimateDepositFee = useCallback(async (amountStr: string, tokenAddress: string) => {
    if (!amountStr || !account || !window.ethereum) return;

    try {
      setFees(prev => ({ ...prev, loading: true, error: null }));
      
      const amount = parseEther(amountStr);
      const decomposition = decomposeAmount(amount);
      
      if (!decomposition.success || decomposition.denominations.length === 0) {
        setFees(prev => ({ ...prev, loading: false }));
        return;
      }

      // Generate dummy commitments for estimation (we don't need real secrets/nullifiers for gas est)
      // Actually, we do need valid points for the contract to accept them, but maybe random numbers work if we don't verify proof on deposit?
      // PrivacyPool.deposit inserts into Merkle tree.
      // PrivacyRouter.depositVariable calls pool.deposit.
      // We need valid inputs. Generating real notes is heavy.
      // Let's use dummy values but correct length.
      const dummyCommitments = decomposition.denominations.map(() => BigInt(12345)); 
      const denominations = decomposition.denominations;

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const router = getPrivacyRouterContract(signer);
      
      // Estimate gas
      // Note: This might fail if the user doesn't have enough tokens for transferFrom, 
      // or allowance is not set. 
      // To avoid this, we can use callStatic or just estimate with a provider and from address?
      // But contract checks transferFrom.
      // If we can't estimate accurately due to state (allowance), we can fallback to a heuristic.
      // Heuristic: Base gas (~100k) + (Gas per pool deposit ~200k) * fragments
      
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || parseEther("0.000000001"); // Fallback 1 gwei

      // Heuristic calculation
      const baseGas = 150000n;
      const gasPerFragment = 250000n; // Conservative estimate for Merkle insertion
      const totalGasLimit = baseGas + (gasPerFragment * BigInt(denominations.length));
      
      const gasCost = totalGasLimit * gasPrice;
      
      setFees({
        gas: formatEther(gasCost),
        total: formatEther(gasCost),
        loading: false,
        error: null
      });

    } catch (error: any) {
      console.error("Fee estimation error:", error);
      setFees(prev => ({ ...prev, loading: false, error: "Failed to estimate" }));
    }
  }, [account]);

  const estimateWithdrawFee = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      setFees(prev => ({ ...prev, loading: true, error: null }));
      
      const provider = new BrowserProvider(window.ethereum);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || parseEther("0.000000001");

      // Withdraw is expensive (verifier + merkle proof + transfers)
      // Estimate: ~400k - 500k gas
      const gasLimit = 500000n;
      const gasCost = gasLimit * gasPrice;

      setFees({
        gas: formatEther(gasCost),
        total: formatEther(gasCost),
        loading: false,
        error: null
      });
    } catch (error) {
      console.error("Withdraw fee estimation error:", error);
      setFees(prev => ({ ...prev, loading: false, error: "Failed to estimate" }));
    }
  }, []);

  return {
    fees,
    estimateDepositFee,
    estimateWithdrawFee
  };
}
