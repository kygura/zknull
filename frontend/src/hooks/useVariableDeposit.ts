import { useState, useCallback } from 'react';
import { parseEther, formatEther, BrowserProvider } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { decomposeAmount, DecompositionResult, formatDecomposition } from '../utils/decomposition';
import { generateNote, saveNotesToLocalStorage, downloadNotes, NoteString, formatNote } from '../utils/crypto';
import { getPrivacyRouterContract } from '../lib/contracts';
import { toast } from 'sonner';

export interface DepositState {
  status: 'idle' | 'decomposing' | 'generating' | 'signing' | 'processing' | 'success' | 'error';
  message?: string;
  txHash?: string;
  notes?: NoteString[];
  decomposition?: DecompositionResult;
}

export function useVariableDeposit() {
  const { account } = useWallet();
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
        toast.warning(`Amount cannot be perfectly decomposed. Dust: ${formatEther(decomposition.remainder)} ETH`);
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
      downloadNotes(formattedNotes, `tornado-notes-${Date.now()}.json`);

      setState({ 
        status: 'signing', 
        message: 'Please sign the transaction in your wallet...',
        notes: formattedNotes
      });

      // Get signer
      const browserProvider = new BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      
      const router = getPrivacyRouterContract(signer);
      
      // Send transaction
      const tx = await router.depositVariable(commitments, denominations, {
        value: amount - decomposition.remainder // Send exact amount required
      });
      
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
  }, [account]);

  return {
    state,
    calculateDecomposition,
    deposit,
    resetState
  };
}
