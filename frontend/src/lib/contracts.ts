import { Contract, BrowserProvider, JsonRpcSigner } from "ethers";
import { PrivacyRouterABI, PrivacyPoolABI } from "./abis";

import localhostDeployments from "../deployments/localhost.json";
import sepoliaDeployments from "../deployments/sepolia.json";

// Type for deployment data
interface DeploymentData {
  network: string;
  contracts: {
    PrivacyRouter: string;
    PrivacyPools: { [key: string]: string };
    [key: string]: any;
  };
}

// Current deployment to use (can be switched based on env)
const currentDeployment: DeploymentData = sepoliaDeployments;

export const getPrivacyRouterAddress = () => currentDeployment.contracts.PrivacyRouter;

export const getPrivacyPoolAddress = (denominationValue: string) => {
  // denominationValue is in wei (e.g., "10000000000000000" for 0.01 ETH)
  // Find the pool by matching denomination value
  const pools = currentDeployment.contracts.PrivacyPools;
  const denominations = currentDeployment.contracts.denominations;
  
  // Find the key that matches this denomination value
  for (const [key, value] of Object.entries(denominations)) {
    if (value === denominationValue) {
      return pools[key];
    }
  }
  
  return null;
};

export const getPrivacyRouterContract = (signerOrProvider: BrowserProvider | JsonRpcSigner) => {
  return new Contract(getPrivacyRouterAddress(), PrivacyRouterABI, signerOrProvider);
};

export const getPrivacyPoolContract = (address: string, signerOrProvider: BrowserProvider | JsonRpcSigner) => {
  return new Contract(address, PrivacyPoolABI, signerOrProvider);
};

export const getAllPoolAddresses = () => currentDeployment.contracts.PrivacyPools;
