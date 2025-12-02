import { expect } from "chai";
import { ethers } from "hardhat";

describe("Tornado", function () {
  let tornado: any;
  let hasher: any;
  let verifier: any;
  let owner: any;
  let addr1: any;
  let addr2: any;

  const FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Hasher = await ethers.getContractFactory("MockHasher");
    hasher = await Hasher.deploy();

    const Verifier = await ethers.getContractFactory("MockVerifier");
    verifier = await Verifier.deploy();

    const Tornado = await ethers.getContractFactory("Tornado");
    tornado = await Tornado.deploy(
      await verifier.getAddress(),
      await hasher.getAddress(),
      ethers.parseEther("1")
    );
  });

  it("Should allow deposit", async function () {
    const commitment = 12345n;
    await tornado.deposit(commitment, { value: ethers.parseEther("1") });
    
    const filter = tornado.filters.Deposit();
    const events = await tornado.queryFilter(filter);
    expect(events.length).to.equal(1);
    // Check if the commitment matches (handling 32 byte conversion)
    expect(events[0].args[0]).to.equal(ethers.zeroPadValue(ethers.toBeHex(commitment), 32));
  });

  it("Should allow withdraw", async function () {
    const commitment = 12345n;
    await tornado.deposit(commitment, { value: ethers.parseEther("1") });

    const root = await tornado.getLastRoot();
    
    // Mock proof
    const proofA = [0, 0];
    const proofB = [[0, 0], [0, 0]];
    const proofC = [0, 0];
    const nullifierHash = 67890n;
    const recipient = addr1.address;
    const relayer = addr2.address;
    const fee = 0;
    const refund = 0;

    await expect(
      tornado.withdraw(
        proofA,
        proofB,
        proofC,
        root,
        nullifierHash,
        recipient,
        relayer,
        fee,
        refund
      )
    ).to.emit(tornado, "Withdrawal");
  });

  it("Should fail double spend", async function () {
    const commitment = 12345n;
    await tornado.deposit(commitment, { value: ethers.parseEther("1") });

    const root = await tornado.getLastRoot();
    const nullifierHash = 67890n;

    await tornado.withdraw(
        [0, 0], [[0, 0], [0, 0]], [0, 0],
        root, nullifierHash, addr1.address, addr2.address, 0, 0
    );

    await expect(
      tornado.withdraw(
        [0, 0], [[0, 0], [0, 0]], [0, 0],
        root, nullifierHash, addr1.address, addr2.address, 0, 0
      )
    ).to.be.revertedWith("The note has been already spent");
  });
});
