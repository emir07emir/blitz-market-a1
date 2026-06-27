const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const net = await hre.ethers.provider.getNetwork();
  const bal = await hre.ethers.provider.getBalance(deployer.address);

  console.log(`Network:  ${net.name} (chainId ${net.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${hre.ethers.formatEther(bal)} MON\n`);

  if (bal === 0n) {
    throw new Error("Deployer has 0 MON. Fund it from https://faucet.monad.xyz and retry.");
  }

  // 1. Deploy BlitzPass
  console.log("Deploying BlitzPass...");
  const PassFactory = await hre.ethers.getContractFactory("BlitzPass");
  const passContract = await PassFactory.deploy();
  await passContract.waitForDeployment();
  const passAddress = await passContract.getAddress();
  console.log(`✅ BlitzPass deployed at: ${passAddress}`);

  const passArtifact = await hre.artifacts.readArtifact("BlitzPass");
  const webDir = path.join(__dirname, "..", "..", "web", "src", "lib");
  fs.mkdirSync(webDir, { recursive: true });
  fs.writeFileSync(
    path.join(webDir, "blitzpass.json"),
    JSON.stringify(
      { address: passAddress, chainId: Number(net.chainId), abi: passArtifact.abi },
      null,
      2
    )
  );
  console.log(`📦 Wrote ABI + address to web/src/lib/blitzpass.json\n`);

  // 2. Deploy BlitzCoin
  console.log("Deploying BlitzCoin...");
  const CoinFactory = await hre.ethers.getContractFactory("BlitzCoin");
  const coinContract = await CoinFactory.deploy();
  await coinContract.waitForDeployment();
  const coinAddress = await coinContract.getAddress();
  console.log(`✅ BlitzCoin deployed at: ${coinAddress}`);

  const coinArtifact = await hre.artifacts.readArtifact("BlitzCoin");
  const sharedDir = path.join(__dirname, "..", "..", "shared");
  fs.mkdirSync(sharedDir, { recursive: true });
  fs.writeFileSync(
    path.join(sharedDir, "blitzcoin.json"),
    JSON.stringify(
      { 
        address: coinAddress, 
        chainId: Number(net.chainId),
        rpcUrl: "https://testnet-rpc.monad.xyz",
        explorerUrl: "https://testnet.monadexplorer.com",
        abi: coinArtifact.abi 
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
