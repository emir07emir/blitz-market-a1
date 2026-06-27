import { createPublicClient, http, type Abi } from "viem";
import { monadTestnet, MONAD_RPC_URL } from "./chain";
import blitz from "./blitzpass.json";

export const CONTRACT_ADDRESS = (blitz.address || "") as `0x${string}` | "";
export const CONTRACT_ABI = blitz.abi as Abi;
export const CHAIN_ID = blitz.chainId;

export const isDeployed = Boolean(CONTRACT_ADDRESS);

export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(MONAD_RPC_URL),
});
