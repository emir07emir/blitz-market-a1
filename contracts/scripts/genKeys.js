// Generates a deployer key + a pool of relayer keys, writes the env files,
// and prints ONLY the addresses to fund. Run: npm run keys
// Then fund the printed addresses from the Monad faucet: https://faucet.monad.xyz
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const POOL_SIZE = Number(process.env.POOL_SIZE || 4);

function makeWallet() {
  const w = ethers.Wallet.createRandom();
  return { address: w.address, privateKey: w.privateKey };
}

const deployer = makeWallet();
const relayers = Array.from({ length: POOL_SIZE }, () => makeWallet());

const contractsEnv = path.join(__dirname, "..", ".env");
const webEnv = path.join(__dirname, "..", "..", "web", ".env.local");

function writeIfAbsent(file, contents) {
  if (fs.existsSync(file)) {
    console.log(`! ${file} already exists — leaving it untouched.`);
    return;
  }
  fs.writeFileSync(file, contents);
  console.log(`✓ wrote ${file}`);
}

writeIfAbsent(
  contractsEnv,
  `PRIVATE_KEY=${deployer.privateKey}\nMONAD_RPC_URL=https://testnet-rpc.monad.xyz\nPOOL_SIZE=${POOL_SIZE}\n`
);
writeIfAbsent(
  webEnv,
  `RELAYER_KEYS=${relayers.map((r) => r.privateKey).join(",")}\nMONAD_RPC_URL=https://testnet-rpc.monad.xyz\n`
);

console.log("\n=== FUND THESE ADDRESSES (testnet MON) ===");
console.log("Faucet: https://faucet.monad.xyz\n");
console.log("Deployer:");
console.log("  " + deployer.address);
console.log("Relayer pool:");
relayers.forEach((r) => console.log("  " + r.address));
console.log(
  "\nPrivate keys were written to contracts/.env and web/.env.local (gitignored). Keep them secret."
);
