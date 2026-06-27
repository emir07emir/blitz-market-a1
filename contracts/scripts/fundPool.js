// Distributes a little MON from the deployer to each relayer in the pool,
// so you only have to use the faucet on ONE address (the deployer).
// Run AFTER funding the deployer:  npx hardhat run scripts/fundPool.js --network monadTestnet
const hre = require("hardhat");

const PER_RELAYER = hre.ethers.parseEther(process.env.PER_RELAYER || "0.3");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const bal = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer ${deployer.address} balance: ${hre.ethers.formatEther(bal)} MON`);

  // Derive relayer addresses from web/.env.local RELAYER_KEYS
  const fs = require("fs");
  const path = require("path");
  const envPath = path.join(__dirname, "..", "..", "web", ".env.local");
  const env = fs.readFileSync(envPath, "utf8");
  const m = env.match(/RELAYER_KEYS=([^\n\r]+)/);
  if (!m) throw new Error("RELAYER_KEYS not found in web/.env.local");
  const keys = m[1].split(",").map((s) => s.trim()).filter(Boolean);
  const addrs = keys.map((k) => new hre.ethers.Wallet(k).address);

  for (const to of addrs) {
    const cur = await hre.ethers.provider.getBalance(to);
    if (cur >= PER_RELAYER) {
      console.log(`• ${to} already has ${hre.ethers.formatEther(cur)} MON — skip`);
      continue;
    }
    const tx = await deployer.sendTransaction({ to, value: PER_RELAYER });
    await tx.wait();
    console.log(`→ sent ${hre.ethers.formatEther(PER_RELAYER)} MON to ${to}`);
  }
  console.log("✅ relayer pool funded");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
