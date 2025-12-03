import { useState, useCallback } from 'react';
import { BrowserProvider, Contract, parseEther } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { parseNote } from '../utils/crypto';
import { generateWithdrawProof, formatProofForContract, getMerklePath, generateNullifierHash } from '../utils/proof';
import { getPrivacyPoolAddress } from '../lib/contracts';
import { PrivacyPoolABI } from '../lib/abis';
import { toast } from 'sonner';

export interface WithdrawState {
  status: 'idle' | 'parsing' | 'fetching' | 'generating' | 'signing' | 'processing' | 'success' | 'error';
  message?: string;
  txHash?: string;
}

export function useWithdraw() {
  const { account } = useWallet();
  const [state, setState] = useState<WithdrawState>({ status: 'idle' });

  const withdraw = useCallback(async (
    noteString: string,
    recipient: string,
    relayerAddress: string = '0x0000000000000000000000000000000000000000',
    fee: bigint = 0n
  ) => {
    if (!account || typeof window.ethereum === 'undefined') {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setState({ status: 'parsing', message: 'Parsing note...' });
      
      // Parse the note
      const note = parseNote(noteString);
      if (!note) {
        throw new Error('Invalid note format');
      }

      // Get the pool contract for this denomination
      // note.denomination is already in wei (e.g., 10000000000000000n for 0.01 ETH)
      const denominationWei = note.denomination.toString();
      const poolAddress = getPrivacyPoolAddress(denominationWei);
      
      if (!poolAddress) {
        throw new Error(`No pool found for denomination ${denominationWei} wei`);
      }

      setState({ status: 'fetching', message: 'Fetching Merkle proof...' });

      // Get provider and contract
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const poolContract = new Contract(poolAddress, PrivacyPoolABI, signer);

      // Regenerate commitment to find in tree
      const { generateCommitment } = await import('../utils/proof');
      const commitment = await generateCommitment(note.secret, note.nullifier);

      // Get Merkle path
      const merklePath = await getMerklePath(poolContract, commitment);
      if (!merklePath) {
        throw new Error('Could not find commitment in Merkle tree. Note may not have been deposited.');
      }

      // Get current root
      const root = await poolContract.getLastRoot();

      setState({ status: 'generating', message: 'Generating zero-knowledge proof... This may take a minute.' });

      // Generate the proof
      const proofData = await generateWithdrawProof(
        note.secret,
        note.nullifier,
        recipient,
        relayerAddress,
        fee,
        0n, // refund
        merklePath.pathElements,
        merklePath.pathIndices,
        BigInt(root)
      );

      if (!proofData) {
        throw new Error('Failed to generate proof');
      }

      const { proof, publicSignals } = proofData;
      const formattedProof = formatProofForContract(proof);

      // Generate nullifier hash
      const nullifierHash = await generateNullifierHash(note.nullifier);

      setState({ status: 'signing', message: 'Please sign the transaction...' });

      // Call withdraw on contract
      const tx = await poolContract.withdraw(
        formattedProof.a,
        formattedProof.b,
        formattedProof.c,
        publicSignals[0], // root
        nullifierHash,
        recipient,
        relayerAddress,
        fee,
        0 // refund
      );

      setState({ 
        status: 'processing', 
        message: 'Transaction submitted. Waiting for confirmation...',
        txHash: tx.hash
      });

      await tx.wait();

      setState({ 
        status: 'success', 
        message: 'Withdrawal successful!',
        txHash: tx.hash
      });

      toast.success('Withdrawal successful!');

    } catch (error: any) {
      console.error('Withdrawal error:', error);
      setState({ 
        status: 'error', 
        message: error.message || 'Withdrawal failed' 
      });
      toast.error(error.message || 'Withdrawal failed');
    }
  }, [account]);

  const resetState = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return {
    state,
    withdraw,
    resetState
  };
}
