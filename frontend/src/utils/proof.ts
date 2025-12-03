/**
 * Proof generation utilities for withdrawal
 * Handles ZK proof generation using snarkjs
 */

import { buildPoseidon } from "circomlibjs";
import { groth16 } from "snarkjs";

// Cache Poseidon hasher
let poseidonHash: any = null;

async function getPoseidon() {
  if (!poseidonHash) {
    poseidonHash = await buildPoseidon();
  }
  return poseidonHash;
}

/**
 * Generate nullifier hash from nullifier
 */
export async function generateNullifierHash(nullifier: bigint): Promise<bigint> {
  const poseidon = await getPoseidon();
  const hash = poseidon([nullifier]);
  return poseidon.F.toObject(hash);
}

/**
 * Generate commitment from secret and nullifier
 */
export async function generateCommitment(secret: bigint, nullifier: bigint): Promise<bigint> {
  const poseidon = await getPoseidon();
  const hash = poseidon([nullifier, secret]);
  return poseidon.F.toObject(hash);
}

/**
 * Get Merkle path for a commitment
 * This queries the contract to get the path elements and indices
 */
export async function getMerklePath(
  contract: any,
  commitment: bigint
): Promise<{ pathElements: string[]; pathIndices: number[] } | null> {
  try {
    // Get all deposits from contract events
    const filter = contract.filters.PoolDeposit();
    const events = await contract.queryFilter(filter);
    
    // Find the index of our commitment
    const leaves = events.map((e: any) => BigInt(e.args.commitment));
    const index = leaves.findIndex((leaf: bigint) => leaf === commitment);
    
    if (index === -1) {
      return null;
    }

    // Build Merkle tree locally to get path
    const levels = 20;
    const pathElements: string[] = [];
    const pathIndices: number[] = [];
    
    let currentIndex = index;
    let currentLevelHash = commitment;
    
    for (let i = 0; i < levels; i++) {
      const isLeft = currentIndex % 2 === 0;
      pathIndices.push(isLeft ? 0 : 1);
      
      // Get sibling
      const siblingIndex = isLeft ?
       currentIndex + 1 : currentIndex - 1;
      const sibling = siblingIndex < leaves.length ? leaves[siblingIndex] : 0n;
      pathElements.push(sibling.toString());
      
      // Move to parent level
      currentIndex = Math.floor(currentIndex / 2);
    }
    
    return { pathElements, pathIndices };
  } catch (error) {
    console.error("Error getting Merkle path:", error);
    return null;
  }
}

/**
 * Generate withdrawal proof
 */
export async function generateWithdrawProof(
  secret: bigint,
  nullifier: bigint,
  recipient: string,
  relayer: string,
  fee: bigint,
  refund: bigint,
  pathElements: string[],
  pathIndices: number[],
  root: bigint
): Promise<{ proof: any; publicSignals: any } | null> {
  try {
    const nullifierHash = await generateNullifierHash(nullifier);
    
    const input = {
      root: root.toString(),
      nullifierHash: nullifierHash.toString(),
      recipient: BigInt(recipient).toString(),
      relayer: BigInt(relayer).toString(),
      fee: fee.toString(),
      refund: refund.toString(),
      nullifier: nullifier.toString(),
      secret: secret.toString(),
      pathElements: pathElements,
      pathIndices: pathIndices.map(String)
    };

    // Load circuit files from public directory
    const { proof, publicSignals } = await groth16.fullProve(
      input,
      "/circuits/withdraw_js/withdraw.wasm",
      "/circuits/withdraw_final.zkey"
    );

    return { proof, publicSignals };
  } catch (error) {
    console.error("Error generating proof:", error);
    return null;
  }
}

/**
 * Format proof for contract call
 */
export function formatProofForContract(proof: any) {
  return {
    a: [proof.pi_a[0], proof.pi_a[1]],
    b: [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]]
    ],
    c: [proof.pi_c[0], proof.pi_c[1]]
  };
}
