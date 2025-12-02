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

export const getPrivacyPoolAddress = (denominationLabel: string) => {
  return currentDeployment.contracts.PrivacyPools[denominationLabel];
};

export const getPrivacyRouterContract = (signerOrProvider: BrowserProvider | JsonRpcSigner) => {
  return new Contract(getPrivacyRouterAddress(), PrivacyRouterABI, signerOrProvider);
};

export const getPrivacyPoolContract = (address: string, signerOrProvider: BrowserProvider | JsonRpcSigner) => {
  return new Contract(address, PrivacyPoolABI, signerOrProvider);
};

export const getAllPoolAddresses = () => currentDeployment.contracts.PrivacyPools;
