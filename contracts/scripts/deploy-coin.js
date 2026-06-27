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

  const Factory = await hre.ethers.getContractFactory("BlitzCoin");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`\n✅ BlitzCoin deployed at: ${address}`);

  // Export address + ABI to shared/blitzcoin.json
  const artifact = await hre.artifacts.readArtifact("BlitzCoin");
  const outDir = path.join(__dirname, "..", "..", "shared");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "blitzcoin.json"),
    JSON.stringify(
      { 
        address, 
        chainId: Number(net.chainId),
        rpcUrl: "https://testnet-rpc.monad.xyz",
        explorerUrl: "https://testnet.monadexplorer.com",
        abi: artifact.abi 
      },
      null,
      2
    )
  );
  console.log(`📦 Wrote ABI + address to shared/blitzcoin.json`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
