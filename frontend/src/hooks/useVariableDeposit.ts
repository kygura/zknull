import { useState, useCallback } from 'react';
import { parseEther, formatEther, BrowserProvider } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { decomposeAmount, DecompositionResult, formatDecomposition } from '../utils/decomposition';
import { generateNote, saveNotesToLocalStorage, downloadNotes, NoteString, formatNote } from '../utils/crypto';
import { getPrivacyRouterContract } from '../lib/contracts';
import { useZkNullToken } from './useZkNullToken';
import { toast } from 'sonner';

export interface DepositState {
  status: 'idle' | 'decomposing' | 'generating' | 'approving' | 'signing' | 'processing' | 'success' | 'error';
  message?: string;
  txHash?: string;
  notes?: NoteString[];
  decomposition?: DecompositionResult;
}

export function useVariableDeposit() {
  const { account } = useWallet();
  const { approve, checkAllowance, tokenAddress } = useZkNullToken();
  const [state, setState] = useState<DepositState>({ status: 'idle' });

  const resetState = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  const calculateDecomposition = useCallback((amountStr: string) => {
    try {
      if (!amountStr || isNaN(parseFloat(amountStr))) {
        setState(prev => ({ ...prev, decomposition: undefined }));
        return null;
      }
      
      const amount = parseEther(amountStr);
      const result = decomposeAmount(amount);
      
      setState(prev => ({ ...prev, decomposition: result }));
      return result;
    } catch (error) {
      console.error("Decomposition error:", error);
      return null;
    }
  }, []);

  const deposit = useCallback(async (amountStr: string) => {
    if (!account || typeof window.ethereum === 'undefined') {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setState({ status: 'decomposing', message: 'Calculating decomposition...' });
      
      const amount = parseEther(amountStr);
      const decomposition = decomposeAmount(amount);
      
      if (!decomposition.success && decomposition.remainder > 0n) {
        toast.warning(`Amount cannot be perfectly decomposed. Dust: ${formatEther(decomposition.remainder)} ZKN`);
      }

      if (decomposition.denominations.length === 0) {
        throw new Error('Amount too small to deposit');
      }

      // Generate notes
      setState({ status: 'generating', message: `Generating ${decomposition.totalFragments} zero-knowledge notes...` });
      
      const notes = [];
      const commitments = [];
      const denominations = [];

      // Generate a note for each denomination chunk
      for (const denom of decomposition.denominations) {
        const note = await generateNote(denom);
        notes.push(note);
        commitments.push(note.commitment);
        denominations.push(denom);
      }

      // Format notes for storage
      const formattedNotes = notes.map(n => formatNote(n));

      // Save notes locally immediately
      saveNotesToLocalStorage(formattedNotes);
      
      // Trigger download
      downloadNotes(formattedNotes, `zknull-notes-${Date.now()}.json`);

      // Get signer and router contract
      const browserProvider = new BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const router = getPrivacyRouterContract(signer);
      const routerAddress = await router.getAddress();

      // Check allowance and approve if needed
      const totalAmount = amount - decomposition.remainder;
      const hasAllowance = await checkAllowance(routerAddress, totalAmount);

      if (!hasAllowance) {
        setState({ status: 'approving', message: 'Please approve token spending...' });
        await approve(routerAddress, totalAmount);
      }

      setState({ 
        status: 'signing', 
        message: 'Please sign the transaction in your wallet...',
        notes: formattedNotes
      });

      // Send transaction
      // Pass token address as the third argument
      const tx = await router.depositVariable(commitments, denominations, tokenAddress);
      
      setState({ 
        status: 'processing', 
        message: 'Transaction submitted. Waiting for confirmation...',
        txHash: tx.hash,
        notes: formattedNotes
      });

      await tx.wait();
      
      setState({ 
        status: 'success', 
        message: 'Deposit successful!',
        txHash: tx.hash,
        notes: formattedNotes
      });
      
      toast.success('Deposit successful! Notes have been downloaded.');

    } catch (error: any) {
      console.error('Deposit error:', error);
      setState({ 
        status: 'error', 
        message: error.message || 'Deposit failed' 
      });
      toast.error(error.message || 'Deposit failed');
    }
  }, [account, approve, checkAllowance, tokenAddress]);

  return {
    state,
    calculateDecomposition,
    deposit,
    resetState
  };
}
