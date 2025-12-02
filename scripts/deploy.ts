import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Starting deployment...\n");

  // Define denominations in wei
  const denominations = {
    "0.01": ethers.parseEther("0.01"),
    "0.1": ethers.parseEther("0.1"),
    "1": ethers.parseEther("1"),
    "10": ethers.parseEther("10"),
  };

  // 1. Deploy Poseidon Hasher
  console.log("Deploying Poseidon Hasher...");
  const { poseidonContract } = require("circomlibjs");
  const PoseidonHasher = new ethers.ContractFactory(
    poseidonContract.generateABI(2),
    poseidonContract.createCode(2),
    await ethers.provider.getSigner()
  );
  const hasher = await PoseidonHasher.deploy();
  await hasher.waitForDeployment();
  const hasherAddress = await hasher.getAddress();
  console.log(`✓ Poseidon Hasher deployed to: ${hasherAddress}\n`);

  // 2. Deploy Verifier
  console.log("Deploying Verifier...");
  const Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log(`✓ Verifier deployed to: ${verifierAddress}\n`);

  // 3. Deploy 4 PrivacyPool instances
  console.log("Deploying PrivacyPool instances...");
  const PrivacyPool = await ethers.getContractFactory("PrivacyPool");
  const pools: { [key: string]: string } = {};

  for (const [label, denomination] of Object.entries(denominations)) {
    console.log(`  Deploying pool for ${label} ETH...`);
    const pool = await PrivacyPool.deploy(
      verifierAddress,
      hasherAddress,
      denomination
    );
    await pool.waitForDeployment();
    const poolAddress = await pool.getAddress();
    pools[label] = poolAddress;
    console.log(`  ✓ Pool ${label} ETH: ${poolAddress}`);
  }
  console.log();

  // 4. Deploy PrivacyRouter
  console.log("Deploying PrivacyRouter...");
  const PrivacyRouter = await ethers.getContractFactory("PrivacyRouter");
  const router = await PrivacyRouter.deploy();
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log(`✓ PrivacyRouter deployed to: ${routerAddress}\n`);

  // 5. Register pools in router
  console.log("Registering pools in router...");
  for (const [label, denomination] of Object.entries(denominations)) {
    const poolAddress = pools[label];
    console.log(`  Registering ${label} ETH pool...`);
    const tx = await router.registerPool(denomination, poolAddress);
    await tx.wait();
    console.log(`  ✓ Registered ${label} ETH pool`);
  }
  console.log();

  // 6. Save deployment addresses
  const deploymentData = {
    network: (await ethers.provider.getNetwork()).name,
    timestamp: new Date().toISOString(),
    contracts: {
      Hasher: hasherAddress,
      Verifier: verifierAddress,
      PrivacyRouter: routerAddress,
      PrivacyPools: pools,
      denominations: {
        "0.01": denominations["0.01"].toString(),
        "0.1": denominations["0.1"].toString(),
        "1": denominations["1"].toString(),
        "10": denominations["10"].toString(),
      },
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, `${(await ethers.provider.getNetwork()).name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log(`✓ Deployment addresses saved to: ${deploymentPath}\n`);

  // Print summary
  console.log("=" .repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=" .repeat(60));
  console.log(`Hasher:          ${hasherAddress}`);
  console.log(`Verifier:        ${verifierAddress}`);
  console.log(`PrivacyRouter:   ${routerAddress}`);
  console.log("\nPrivacyPools:");
  for (const [label, address] of Object.entries(pools)) {
    console.log(`  ${label.padEnd(6)} ETH: ${address}`);
  }
  console.log("=" .repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
