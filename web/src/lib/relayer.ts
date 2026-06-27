import "server-only";
import {
  createWalletClient,
  http,
  type Hex,
  type WalletClient,
} from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { monadTestnet, MONAD_RPC_URL } from "./chain";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  COIN_ADDRESS,
  COIN_ABI,
  isDeployed,
  publicClient,
} from "./contract";

// A pool of pre-funded server wallets that sponsor gas for the audience.
// Round-robin across keys spreads load (and exploits Monad's parallelism);
// per-signer sequential queue keeps nonces ordered under bursty traffic.

type Signer = {
  account: PrivateKeyAccount;
  client: WalletClient;
  nonce: number | null;
  tail: Promise<unknown>;
};

let signers: Signer[] | null = null;
let rr = 0;

function normalizeKey(k: string): Hex {
  const t = k.trim();
  return (t.startsWith("0x") ? t : `0x${t}`) as Hex;
}

function getSigners(): Signer[] {
  if (signers) return signers;
  const raw = (process.env.RELAYER_KEYS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  signers = raw.map((k) => {
    const account = privateKeyToAccount(normalizeKey(k));
    const client = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(MONAD_RPC_URL),
    });
    return { account, client, nonce: null, tail: Promise.resolve() };
  });
  return signers;
}

export function relayerReady(): boolean {
  return isDeployed && getSigners().length > 0;
}

export function relayerAddresses(): string[] {
  return getSigners().map((s) => s.account.address);
}

async function sendVia(
  signer: Signer,
  functionName: "claimPass" | "react" | "reward",
  args: readonly unknown[]
): Promise<Hex> {
  if (signer.nonce === null) {
    signer.nonce = await publicClient.getTransactionCount({
      address: signer.account.address,
      blockTag: "pending",
    });
  }
  const nonce = signer.nonce;
  signer.nonce = nonce + 1;

  const isCoin = functionName === "reward";
  const targetAddress = isCoin ? COIN_ADDRESS : CONTRACT_ADDRESS;
  const targetAbi = isCoin ? COIN_ABI : CONTRACT_ABI;

  try {
    return await signer.client.writeContract({
      account: signer.account,
      chain: monadTestnet,
      address: targetAddress as `0x${string}`,
      abi: targetAbi,
      functionName,
      args: args as unknown[],
      nonce,
      // Monad charges on the gas limit, not usage — keep it tight but safe.
      gas: 150000n,
    });
  } catch (err) {
    // Re-sync nonce from chain on the next call after a failure.
    signer.nonce = null;
    throw err;
  }
}

export async function relay(
  functionName: "claimPass" | "react" | "reward",
  args: readonly unknown[]
): Promise<Hex> {
  if (!relayerReady()) {
    throw new Error(
      "Relayer not ready: set RELAYER_KEYS in web/.env.local and deploy the contract."
    );
  }
  const pool = getSigners();
  const signer = pool[rr % pool.length];
  rr += 1;

  // Chain onto this signer's tail so its nonces stay strictly ordered.
  const run = signer.tail.then(
    () => sendVia(signer, functionName, args),
    () => sendVia(signer, functionName, args)
  );
  signer.tail = run.catch(() => undefined);
  return run;
}
