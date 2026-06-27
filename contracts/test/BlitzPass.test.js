const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyUint } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("BlitzPass", function () {
  const EVENT_ID = 1n;
  const KIND_FIRE = 0;
  const KIND_HEART = 1;

  let contract;
  let relayer, alice, bob;

  beforeEach(async function () {
    [relayer, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BlitzPass", relayer);
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  it("claimPass checks in a user, increments attendee count and totalTx", async function () {
    await expect(contract.claimPass(EVENT_ID, alice.address))
      .to.emit(contract, "Claimed")
      .withArgs(EVENT_ID, alice.address, 1n, anyUint);

    expect(await contract.attended(EVENT_ID, alice.address)).to.equal(true);
    expect(await contract.attendeeCount(EVENT_ID)).to.equal(1n);
    expect(await contract.totalTx()).to.equal(1n);
  });

  it("claimPass is idempotent: repeat claim does not revert or double-count attendance", async function () {
    await contract.claimPass(EVENT_ID, alice.address);
    await expect(contract.claimPass(EVENT_ID, alice.address)).to.not.be.reverted;

    expect(await contract.attendeeCount(EVENT_ID)).to.equal(1n); // still one attendee
    expect(await contract.totalTx()).to.equal(2n); // but two on-chain txs counted
  });

  it("react records a reaction, bumps score, tally and totalTx", async function () {
    await contract.claimPass(EVENT_ID, alice.address);

    await expect(contract.react(EVENT_ID, KIND_FIRE, alice.address))
      .to.emit(contract, "Reacted")
      .withArgs(EVENT_ID, alice.address, KIND_FIRE, 1n, anyUint);

    expect(await contract.score(EVENT_ID, alice.address)).to.equal(1n);
    expect(await contract.reactionTally(EVENT_ID, KIND_FIRE)).to.equal(1n);
    expect(await contract.totalTx()).to.equal(2n); // claim + react
  });

  it("react auto-checks-in a user who never claimed (no revert)", async function () {
    await expect(contract.react(EVENT_ID, KIND_HEART, bob.address))
      .to.emit(contract, "Claimed")
      .withArgs(EVENT_ID, bob.address, 1n, anyUint)
      .and.to.emit(contract, "Reacted");

    expect(await contract.attended(EVENT_ID, bob.address)).to.equal(true);
    expect(await contract.attendeeCount(EVENT_ID)).to.equal(1n);
    expect(await contract.score(EVENT_ID, bob.address)).to.equal(1n);
  });

  it("tracks per-user leaderboard scores independently", async function () {
    await contract.react(EVENT_ID, KIND_FIRE, alice.address);
    await contract.react(EVENT_ID, KIND_FIRE, alice.address);
    await contract.react(EVENT_ID, KIND_HEART, alice.address);
    await contract.react(EVENT_ID, KIND_FIRE, bob.address);

    expect(await contract.score(EVENT_ID, alice.address)).to.equal(3n);
    expect(await contract.score(EVENT_ID, bob.address)).to.equal(1n);
    expect(await contract.reactionTally(EVENT_ID, KIND_FIRE)).to.equal(3n);
    expect(await contract.reactionTally(EVENT_ID, KIND_HEART)).to.equal(1n);
    expect(await contract.attendeeCount(EVENT_ID)).to.equal(2n);
  });

  it("isolates state between events", async function () {
    await contract.claimPass(1n, alice.address);
    await contract.claimPass(2n, alice.address);

    expect(await contract.attendeeCount(1n)).to.equal(1n);
    expect(await contract.attendeeCount(2n)).to.equal(1n);
    expect(await contract.totalTx()).to.equal(2n);
  });
});
