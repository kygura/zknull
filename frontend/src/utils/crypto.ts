/**
 * Cryptographic utilities for generating notes and commitments
 * Uses Poseidon hash from circomlibjs
 */

import { buildPoseidon } from "circomlibjs";

// Cache the Poseidon hasher instance
let poseidonHash: any = null;

/**
 * Initialize Poseidon hasher (lazy loading)
 */
async function getPoseidon() {
  if (!poseidonHash) {
    poseidonHash = await buildPoseidon();
  }
  return poseidonHash;
}

/**
 * Generate a random value within the BN128 field size
 * BN128 field size (for compatibility with ZK circuits)
 */
const FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

function randomBigInt(): bigint {
  const bytes = new Uint8Array(31); // 31 bytes to stay under field size
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return BigInt("0x" + hex) % FIELD_SIZE;
}

export interface Note {
  secret: bigint;
  nullifier: bigint;
  commitment: bigint;
  denomination: bigint;
}

export interface NoteString {
  secret: string;
  nullifier: string;
  commitment: string;
  denomination: string;
  noteString: string;
}

/**
 * Generate a new note with random secret and nullifier
 * @param denomination - The denomination value in wei
 * @returns Note object with secret, nullifier, and commitment
 */
export async function generateNote(denomination: bigint): Promise<Note> {
  const secret = randomBigInt();
  const nullifier = randomBigInt();
  const commitment = await generateCommitment(secret, nullifier);

  return {
    secret,
    nullifier,
    commitment,
    denomination,
  };
}

/**
 * Generate a commitment from secret and nullifier using Poseidon hash
 * @param secret - Random secret value
 * @param nullifier - Random nullifier value
 * @returns Commitment hash
 */
export async function generateCommitment(
  secret: bigint,
  nullifier: bigint
): Promise<bigint> {
  const poseidon = await getPoseidon();
  
  // Poseidon hash expects an array of field elements
  const hash = poseidon([secret, nullifier]);
  
  // Convert the hash to BigInt
  return poseidon.F.toObject(hash);
}

/**
 * Format a note as a string for storage/export
 * Format: tornado-<denomination>-<secret>-<nullifier>
 */
export function formatNote(note: Note): NoteString {
  const noteString = `tornado-${note.denomination.toString()}-${note.secret.toString(16)}-${note.nullifier.toString(16)}`;
  
  return {
    secret: note.secret.toString(16),
    nullifier: note.nullifier.toString(16),
    commitment: note.commitment.toString(16),
    denomination: note.denomination.toString(),
    noteString,
  };
}

/**
 * Parse a note string back to its components
 * @param noteString - Formatted note string
 * @returns Note components or null if invalid
 */
export function parseNote(noteString: string): Note | null {
  try {
    const parts = noteString.split("-");
    if (parts.length !== 4 || parts[0] !== "tornado") {
      return null;
    }

    const denomination = BigInt(parts[1]);
    const secret = BigInt("0x" + parts[2]);
    const nullifier = BigInt("0x" + parts[3]);

    // Note: we can't reconstruct commitment without async Poseidon
    // This would need to be done separately if needed
    return {
      secret,
      nullifier,
      commitment: 0n, // Placeholder
      denomination,
    };
  } catch (error) {
    console.error("Failed to parse note:", error);
    return null;
  }
}

/**
 * Download notes as a JSON file
 */
export function downloadNotes(notes: NoteString[], filename: string = "tornado-notes.json") {
  const dataStr = JSON.stringify(notes, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Save notes to localStorage
 */
export function saveNotesToLocalStorage(notes: NoteString[]) {
  const timestamp = new Date().toISOString();
  const stored = localStorage.getItem("tornado-notes");
  const existing = stored ? JSON.parse(stored) : [];
  
  existing.push({
    timestamp,
    notes,
  });
  
  localStorage.setItem("tornado-notes", JSON.stringify(existing));
}

/**
 * Get all notes from localStorage
 */
export function getNotesFromLocalStorage(): { timestamp: string; notes: NoteString[] }[] {
  const stored = localStorage.getItem("tornado-notes");
  return stored ? JSON.parse(stored) : [];
}
