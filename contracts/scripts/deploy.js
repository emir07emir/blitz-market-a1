const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const net = await hre.ethers.provider.getNetwork();
  const bal = await hre.ethers.provider.getBalance(deployer.address);

  console.log(`Network:  ${net.name} (chainId ${net.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${hre.ethers.formatEther(bal)} MON`);

  if (bal === 0n) {
    throw new Error("Deployer has 0 MON. Fund it from https://faucet.monad.xyz and retry.");
  }

  const Factory = await hre.ethers.getContractFactory("BlitzPass");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`\n✅ BlitzPass deployed at: ${address}`);

  // Export address + ABI to the web app so the frontend/relayer can import it.
  const artifact = await hre.artifacts.readArtifact("BlitzPass");
  const outDir = path.join(__dirname, "..", "..", "web", "src", "lib");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "blitzpass.json"),
    JSON.stringify(
      { address, chainId: Number(net.chainId), abi: artifact.abi },
      null,
      2
    )
  );
  console.log(`📦 Wrote ABI + address to web/src/lib/blitzpass.json`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
