const { expect } = require("chai");
const { ethers } = require("hardhat"); 

describe("IPRegistry", function () {
  let registry;
  let owner;

  before(async function () {
    // Get the contract owner's account (V6 Syntax)
    [owner] = await ethers.getSigners();
    
    // Get the Contract Factory (V6 Syntax)
    const IPRegistry = await ethers.getContractFactory("IPRegistry"); 
    
    // Deploy the contract
    registry = await IPRegistry.deploy();
    
    // Wait for deployment confirmation (V6 Syntax)
    await registry.waitForDeployment(); 
  });

  it("Should register a new asset successfully", async function () {
    const mockHash = "0x123abc..."; 
    
    // V6 Syntax: Contract function calls 
    await registry.registerIP(mockHash, "ipfs://test");

    // V6 Syntax: Use staticCall for view functions (no gas spent)
    const [storedOwner] = await registry.verifyIP.staticCall(mockHash); 
    expect(storedOwner).to.equal(owner.address);
  });

  it("Should fail to register duplicate content", async function () {
    const duplicateHash = "0x456def...";
    
    // Deploy a fresh contract instance for a clean test environment (best practice)
    const IPRegistry = await ethers.getContractFactory("IPRegistry");
    const newRegistry = await IPRegistry.deploy();
    await newRegistry.waitForDeployment();

    // Register the asset once
    await newRegistry.registerIP(duplicateHash, "ipfs://first");

    // Expect transaction to revert when registering again
    await expect(newRegistry.registerIP(duplicateHash, "ipfs://test2"))
      .to.be.revertedWith("Error: This content has already been registered.");
  });
});