import { useState, useCallback, useEffect } from 'react';
import { Contract, formatEther, parseEther, BrowserProvider } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { toast } from 'sonner';

// ABI for ZkNullToken (minimal)
const TOKEN_ABI = [
  "function mint(address to, uint256 amount) public",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// You should replace this with the actual deployed address from your deployment
const TOKEN_ADDRESS = "0xc08a7930dD9388e4b5E0A51fE6b54A1Cfcc5B7bB"; 

export function useZkNullToken() {
  const { account } = useWallet();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  const getContract = useCallback(async (withSigner = false) => {
    if (!window.ethereum) return null;
    const provider = new BrowserProvider(window.ethereum);
    if (withSigner) {
      const signer = await provider.getSigner();
      return new Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
    }
    return new Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
  }, []);

  const updateBalance = useCallback(async () => {
    if (!account) return;
    try {
      const contract = await getContract();
      if (!contract) return;
      const bal = await contract.balanceOf(account);
      setBalance(formatEther(bal));
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  }, [account, getContract]);

  useEffect(() => {
    updateBalance();
    const interval = setInterval(updateBalance, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [updateBalance]);

  const mint = useCallback(async (amountStr: string) => {
    if (!account) return;
    try {
      setLoading(true);
      const contract = await getContract(true);
      if (!contract) throw new Error("No contract");
      
      const amount = parseEther(amountStr);
      const tx = await contract.mint(account, amount);
      toast.info("Minting tokens...");
      await tx.wait();
      toast.success(`Successfully minted ${amountStr} ZKN`);
      updateBalance();
    } catch (error: any) {
      console.error("Mint error:", error);
      toast.error(error.message || "Mint failed");
    } finally {
      setLoading(false);
    }
  }, [account, getContract, updateBalance]);

  const approve = useCallback(async (spender: string, amount: bigint) => {
    if (!account) return;
    try {
      const contract = await getContract(true);
      if (!contract) throw new Error("No contract");
      
      const tx = await contract.approve(spender, amount);
      toast.info("Approving tokens...");
      await tx.wait();
      toast.success("Approval successful");
    } catch (error: any) {
      console.error("Approval error:", error);
      throw error;
    }
  }, [account, getContract]);

  const checkAllowance = useCallback(async (spender: string, amount: bigint) => {
    if (!account) return false;
    try {
      const contract = await getContract();
      if (!contract) return false;
      const allowance = await contract.allowance(account, spender);
      return allowance >= amount;
    } catch (error) {
      console.error("Allowance check error:", error);
      return false;
    }
  }, [account, getContract]);

  return {
    balance,
    loading,
    mint,
    approve,
    checkAllowance,
    tokenAddress: TOKEN_ADDRESS
  };
}
