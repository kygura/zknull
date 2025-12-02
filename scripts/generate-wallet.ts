import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Generating new testing wallet...\n");

  // Generate a random wallet
  const wallet = ethers.Wallet.createRandom();

  const walletInfo = {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase || "",
    createdAt: new Date().toISOString(),
  };

  // Save to JSON file
  const walletPath = path.join(__dirname, "..", "test-wallet.json");
  fs.writeFileSync(walletPath, JSON.stringify(walletInfo, null, 2));
  console.log(`✓ Wallet saved to: ${walletPath}`);

  // Update .env file
  const envPath = path.join(__dirname, "..", ".env");
  let envContent = "";

  // Read existing .env if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  }

  // Update or add PRIVATE_KEY
  const privateKeyRegex = /^PRIVATE_KEY=.*$/m;
  if (privateKeyRegex.test(envContent)) {
    envContent = envContent.replace(
      privateKeyRegex,
      `PRIVATE_KEY=${wallet.privateKey}`
    );
  } else {
    // Add PRIVATE_KEY if it doesn't exist
    if (envContent && !envContent.endsWith("\n")) {
      envContent += "\n";
    }
    envContent += `PRIVATE_KEY=${wallet.privateKey}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log(`✓ Updated .env file with PRIVATE_KEY\n`);

  // Print wallet info
  console.log("=" .repeat(60));
  console.log("WALLET INFORMATION");
  console.log("=" .repeat(60));
  console.log(`Address:     ${wallet.address}`);
  console.log(`Private Key: ${wallet.privateKey}`);
  console.log(`Mnemonic:    ${wallet.mnemonic?.phrase}`);
  console.log("=" .repeat(60));
  console.log("\n⚠️  IMPORTANT: This is a TEST wallet. Fund it with testnet ETH only!");
  console.log("⚠️  Never use this wallet on mainnet or with real funds!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
