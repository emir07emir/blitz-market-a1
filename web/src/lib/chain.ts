import { defineChain } from "viem";

export const MONAD_RPC_URL =
  process.env.MONAD_RPC_URL ||
  process.env.NEXT_PUBLIC_MONAD_RPC_URL ||
  "https://testnet-rpc.monad.xyz";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [MONAD_RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
  testnet: true,
});

export const EXPLORER_TX = (hash: string) =>
  `https://testnet.monadexplorer.com/tx/${hash}`;
