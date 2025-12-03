import { expect } from "chai";
import { ethers } from "hardhat";

describe("PrivacyRouter", function () {
  let router: any;
  let hasher: any;
  let verifier: any;
  let pool001: any;
  let pool01: any;
  let pool1: any;
  let pool10: any;
  let owner: any;
  let user1: any;
  let user2: any;

  let token: any;

  const DENOM_001 = ethers.parseEther("0.01");
  const DENOM_01 = ethers.parseEther("0.1");
  const DENOM_1 = ethers.parseEther("1");
  const DENOM_10 = ethers.parseEther("10");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy Token
    const ZkNullToken = await ethers.getContractFactory("ZkNullToken");
    token = await ZkNullToken.deploy();
    await token.waitForDeployment();

    // Mint tokens to users
    await token.mint(user1.address, ethers.parseEther("100"));
    await token.mint(user2.address, ethers.parseEther("100"));

    // Deploy Hasher
    const Hasher = await ethers.getContractFactory("MockHasher");
    hasher = await Hasher.deploy();

    // Deploy Verifier
    const Verifier = await ethers.getContractFactory("MockVerifier");
    verifier = await Verifier.deploy();

    // Deploy 4 PrivacyPools
    const PrivacyPool = await ethers.getContractFactory("PrivacyPool");
    const tokenAddr = await token.getAddress();
    
    pool001 = await PrivacyPool.deploy(
      await verifier.getAddress(),
      await hasher.getAddress(),
      DENOM_001,
      tokenAddr
    );

    pool01 = await PrivacyPool.deploy(
      await verifier.getAddress(),
      await hasher.getAddress(),
      DENOM_01,
      tokenAddr
    );

    pool1 = await PrivacyPool.deploy(
      await verifier.getAddress(),
      await hasher.getAddress(),
      DENOM_1,
      tokenAddr
    );

    pool10 = await PrivacyPool.deploy(
      await verifier.getAddress(),
      await hasher.getAddress(),
      DENOM_10,
      tokenAddr
    );

    // Deploy Router
    const PrivacyRouter = await ethers.getContractFactory("PrivacyRouter");
    router = await PrivacyRouter.deploy();

    // Register all pools
    await router.registerPool(DENOM_001, await pool001.getAddress());
    await router.registerPool(DENOM_01, await pool01.getAddress());
    await router.registerPool(DENOM_1, await pool1.getAddress());
    await router.registerPool(DENOM_10, await pool10.getAddress());

    // Approve router to spend user tokens
    await token.connect(user1).approve(await router.getAddress(), ethers.parseEther("100"));
    await token.connect(user2).approve(await router.getAddress(), ethers.parseEther("100"));
  });

  describe("Pool Registration", function () {
    it("Should register pools correctly", async function () {
      expect(await router.getPool(DENOM_001)).to.equal(await pool001.getAddress());
      expect(await router.getPool(DENOM_01)).to.equal(await pool01.getAddress());
      expect(await router.getPool(DENOM_1)).to.equal(await pool1.getAddress());
      expect(await router.getPool(DENOM_10)).to.equal(await pool10.getAddress());
    });

    it("Should track registered denominations", async function () {
      const denoms = await router.getRegisteredDenominations();
      expect(denoms.length).to.equal(4);
      expect(denoms).to.include(DENOM_001);
      expect(denoms).to.include(DENOM_01);
      expect(denoms).to.include(DENOM_1);
      expect(denoms).to.include(DENOM_10);
    });

    it("Should prevent duplicate pool registration", async function () {
      const PrivacyPool = await ethers.getContractFactory("PrivacyPool");
      const duplicatePool = await PrivacyPool.deploy(
        await verifier.getAddress(),
        await hasher.getAddress(),
        DENOM_1,
        await token.getAddress()
      );

      await expect(
        router.registerPool(DENOM_1, await duplicatePool.getAddress())
      ).to.be.revertedWith("Pool already registered");
    });

    it("Should only allow owner to register pools", async function () {
      const PrivacyPool = await ethers.getContractFactory("PrivacyPool");
      const newPool = await PrivacyPool.deploy(
        await verifier.getAddress(),
        await hasher.getAddress(),
        ethers.parseEther("5"),
        await token.getAddress()
      );

      await expect(
        router.connect(user1).registerPool(ethers.parseEther("5"), await newPool.getAddress())
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Single Pool Deposit", function () {
    it("Should deposit 1.0 ETH to single pool", async function () {
      const commitment = 12345n;
      const commitments = [commitment];
      const denominations = [DENOM_1];

      await router.connect(user1).depositVariable(commitments, denominations, await token.getAddress());

      // Check that pool received the deposit
      const poolBalance = await token.balanceOf(await pool1.getAddress());
      expect(poolBalance).to.equal(DENOM_1);
    });

    it("Should emit VariableDeposit event", async function () {
      const commitment = 12345n;
      const commitments = [commitment];
      const denominations = [DENOM_1];

      await expect(
        router.connect(user1).depositVariable(commitments, denominations, await token.getAddress())
      )
        .to.emit(router, "VariableDeposit")
        .withArgs(user1.address, DENOM_1, 1);
    });
  });

  describe("Variable Deposit - Multiple Pools", function () {
    it("Should deposit 1.1 ETH across 2 pools (1.0 + 0.1)", async function () {
      const commitment1 = 11111n;
      const commitment2 = 22222n;
      const commitments = [commitment1, commitment2];
      const denominations = [DENOM_1, DENOM_01];
      const totalAmount = DENOM_1 + DENOM_01;

      await router.connect(user1).depositVariable(commitments, denominations, await token.getAddress());

      // Check pool balances
      const pool1Balance = await token.balanceOf(await pool1.getAddress());
      const pool01Balance = await token.balanceOf(await pool01.getAddress());

      expect(pool1Balance).to.equal(DENOM_1);
      expect(pool01Balance).to.equal(DENOM_01);
    });

    it("Should deposit 3.74 ETH across multiple pools", async function () {
      // 3.74 = 3*1 + 7*0.1 + 4*0.01
      const commitments = [
        1001n, 1002n, 1003n, // 3 x 1 ETH
        2001n, 2002n, 2003n, 2004n, 2005n, 2006n, 2007n, // 7 x 0.1 ETH
        3001n, 3002n, 3003n, 3004n, // 4 x 0.01 ETH
      ];

      const denominations = [
        DENOM_1, DENOM_1, DENOM_1,
        DENOM_01, DENOM_01, DENOM_01, DENOM_01, DENOM_01, DENOM_01, DENOM_01,
        DENOM_001, DENOM_001, DENOM_001, DENOM_001,
      ];

      const totalAmount = ethers.parseEther("3.74");

      await router.connect(user1).depositVariable(commitments, denominations, await token.getAddress());

      // Verify event
      const filter = router.filters.VariableDeposit();
      const events = await router.queryFilter(filter);
      expect(events.length).to.equal(1);
      expect(events[0].args[1]).to.equal(totalAmount);
      expect(events[0].args[2]).to.equal(14); // 14 fragments
    });
  });

  describe("Validation Tests", function () {
    it("Should reject array length mismatch", async function () {
      const commitments = [123n, 456n];
      const denominations = [DENOM_1]; // Mismatch: 2 commitments, 1 denomination

      await expect(
        router.connect(user1).depositVariable(commitments, denominations, await token.getAddress())
      ).to.be.revertedWith("Array length mismatch");
    });

    it("Should fail if transfer fails (e.g. no allowance)", async function () {
      const commitments = [123n, 456n];
      const denominations = [DENOM_1, DENOM_01];
      
      // Reset allowance
      await token.connect(user1).approve(await router.getAddress(), 0);

      await expect(
        router.connect(user1).depositVariable(commitments, denominations, await token.getAddress())
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
      
      // Restore allowance
      await token.connect(user1).approve(await router.getAddress(), ethers.parseEther("100"));
    });

    // Excess ETH test is not relevant for ERC20 as contract pulls exact amount

    it("Should reject unregistered denomination", async function () {
      const commitments = [123n];
      const unregisteredDenom = ethers.parseEther("5"); // 5 ETH not registered
      const denominations = [unregisteredDenom];

      await expect(
        router.connect(user1).depositVariable(commitments, denominations, await token.getAddress())
      ).to.be.revertedWith("Pool not found for denomination");
    });

    it("Should reject empty deposit", async function () {
      await expect(
        router.connect(user1).depositVariable([], [], await token.getAddress())
      ).to.be.revertedWith("Empty deposit");
    });
  });

  describe("Individual Pool Functionality", function () {
    it("Should allow direct deposit to PrivacyPool", async function () {
      const commitment = 54321n;
      
      // Approve pool
      await token.connect(user1).approve(await pool1.getAddress(), DENOM_1);

      await pool1.connect(user1).deposit(commitment);
      
      const poolBalance = await token.balanceOf(await pool1.getAddress());
      expect(poolBalance).to.equal(DENOM_1);
    });

    it("Should fail if transfer fails (e.g. no allowance)", async function () {
      const commitment = 54321n;
      
      // No allowance
      await token.connect(user1).approve(await pool1.getAddress(), 0);

      await expect(
        pool1.connect(user1).deposit(commitment)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });
  });
});
