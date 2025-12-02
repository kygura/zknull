# Variable-Amount Privacy Mixer

A privacy-preserving mixer that allows variable amount deposits by decomposing them into fixed denominations.

## Project Structure

- `contracts/`: Solidity smart contracts
  - `PrivacyPool.sol`: Fixed denomination pool
  - `PrivacyRouter.sol`: Orchestrator for variable deposits
- `frontend/`: React frontend
  - `src/hooks/useVariableDeposit.ts`: Core logic hook
  - `src/utils/decomposition.ts`: Amount decomposition logic
  - `src/utils/crypto.ts`: ZK note generation

## Prerequisites

- Node.js v18+
- Hardhat

## Setup

1. Install dependencies:
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

2. Compile contracts:
   ```bash
   npx hardhat compile
   ```

3. Run tests:
   ```bash
   npx hardhat test
   ```

## Running Locally

1. Start Hardhat node:
   ```bash
   npx hardhat node
   ```

2. Deploy contracts to localhost (in a new terminal):
   ```bash
   npx hardhat run scripts/deploy.ts --network localhost
   ```
   This will save deployment addresses to `frontend/src/deployments/localhost.json`.

3. Start Frontend (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

4. Open `http://localhost:8080` (or the port shown)
5. Connect MetaMask to `Localhost 8545`
6. Go to "Fund" tab, enter an amount (e.g., 1.1 ETH), and click Deposit.

## Sepolia Deployment

1. Set environment variables in `.env`:
   ```
   SEPOLIA_RPC_URL=...
   PRIVATE_KEY=...
   ETHERSCAN_API_KEY=...
   ```

2. Deploy:
   ```bash
   npx hardhat run scripts/deploy.ts --network sepolia
   ```

3. Copy `deployments/sepolia.json` to `frontend/src/deployments/sepolia.json` and update `frontend/src/lib/contracts.ts` to use it.
