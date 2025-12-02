#!/bin/bash
set -e

# Create directories
mkdir -p build/circuits
mkdir -p contracts

# Compile circuit
echo "Compiling withdraw.circom..."
circom circuits/withdraw.circom --r1cs --wasm --sym --c --output build/circuits

# Generate witness (optional, for testing)
# node build/circuits/withdraw_js/generate_witness.js build/circuits/withdraw_js/withdraw.wasm input.json witness.wtns

# Setup Groth16
echo "Setting up Groth16..."
# Phase 1 (Powers of Tau) - using a pre-computed pot12 for testing speed (should use larger for prod)
# For this example, we'll generate a fresh one for simplicity but it's slow for large circuits
# Ideally download: https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau

if [ ! -f build/circuits/pot15_final.ptau ]; then
    echo "Downloading Powers of Tau..."
    curl -L -o build/circuits/pot15_final.ptau https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_15.ptau
fi

# Phase 2
echo "Generating zkey..."
npx snarkjs groth16 setup build/circuits/withdraw.r1cs build/circuits/pot15_final.ptau build/circuits/withdraw_0000.zkey
echo "Contributing to phase 2..."
echo "test" | npx snarkjs zkey contribute build/circuits/withdraw_0000.zkey build/circuits/withdraw_final.zkey --name="1st Contributor Name" -v

# Export Verifier
echo "Exporting Verifier.sol..."
npx snarkjs zkey export solidityverifier build/circuits/withdraw_final.zkey contracts/Verifier.sol

# Update Verifier pragma to match project
sed -i 's/pragma solidity ^0.6.11;/pragma solidity ^0.8.0;/g' contracts/Verifier.sol

echo "Done!"
