"use client";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const KEY = "blitzpass.pk.v1";

export type Burner = { address: `0x${string}` };

// A zero-friction "embedded wallet": a burner key generated in the browser and
// kept in localStorage. It's only an identity tag — the relayer pays gas — so
// the audience never sees a wallet popup, a seed phrase, or a faucet.
// (Para embedded MPC wallets are the production upgrade; see README.)
export function getBurner(): Burner {
  if (typeof window === "undefined") {
    throw new Error("getBurner() is client-only");
  }
  let pk = window.localStorage.getItem(KEY);
  if (!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk)) {
    pk = generatePrivateKey();
    window.localStorage.setItem(KEY, pk);
  }
  const account = privateKeyToAccount(pk as `0x${string}`);
  return { address: account.address };
}

export function resetBurner(): Burner {
  const pk = generatePrivateKey();
  window.localStorage.setItem(KEY, pk);
  return { address: privateKeyToAccount(pk).address };
}
