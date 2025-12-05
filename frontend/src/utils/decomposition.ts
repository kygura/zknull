/**
 * Decomposition utilities for breaking down ZKN amounts into fixed denominations
 */

// Standard denominations in wei (descending order for greedy algorithm)
export const DENOMINATIONS = [
  { label: "10 ZKN", value: 10n * 10n ** 18n },
  { label: "1 ZKN", value: 1n * 10n ** 18n },
  { label: "0.1 ZKN", value: 1n * 10n ** 17n },
  { label: "0.01 ZKN", value: 1n * 10n ** 16n },
] as const;

export interface DecompositionResult {
  denominations: bigint[];
  counts: Map<string, number>;
  totalFragments: number;
  remainder: bigint;
  success: boolean;
}

/**
 * Decomposes an amount into fixed denominations using greedy algorithm
 * @param amount - Amount in wei to decompose
 * @returns Array of denomination values
 * 
 * @example
 * // Returns [1 ZKN, 1 ZKN, 1 ZKN, 0.1 ZKN, 0.1 ZKN, 0.1 ZKN, 0.1 ZKN, 0.1 ZKN, 0.1 ZKN, 0.1 ZKN, 0.01 ZKN x5]
 * decomposeAmount(parseEther("3.75"))
 */
export function decomposeAmount(amount: bigint): DecompositionResult {
  if (amount <= 0n) {
    return {
      denominations: [],
      counts: new Map(),
      totalFragments: 0,
      remainder: amount,
      success: false,
    };
  }

  const result: bigint[] = [];
  const counts = new Map<string, number>();
  let remaining = amount;

  // Greedy algorithm: use largest denominations first
  for (const { label, value } of DENOMINATIONS) {
    const count = remaining / value;
    
    if (count > 0n) {
      // Add this denomination 'count' times
      for (let i = 0n; i < count; i++) {
        result.push(value);
      }
      
      counts.set(label, Number(count));
      remaining -= count * value;
    }
  }

  return {
    denominations: result,
    counts,
    totalFragments: result.length,
    remainder: remaining,
    success: remaining === 0n,
  };
}

/**
 * Formats decomposition result for display
 */
export function formatDecomposition(result: DecompositionResult): string {
  const parts: string[] = [];
  
  for (const [label, count] of result.counts) {
    parts.push(`${count}x ${label}`);
  }
  
  return parts.join(" + ");
}

/**
 * Validates if an amount can be perfectly decomposed
 */
export function canDecompose(amount: bigint): boolean {
  const result = decomposeAmount(amount);
  return result.success;
}

/**
 * Gets the smallest denomination value
 */
export function getSmallestDenomination(): bigint {
  return DENOMINATIONS[DENOMINATIONS.length - 1].value;
}

/**
 * Calculates the maximum possible decomposition error
 */
export function getMaxRemainder(): bigint {
  return getSmallestDenomination() - 1n;
}
