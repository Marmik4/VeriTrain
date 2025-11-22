const hre = require("hardhat");

async function main() {
  // Get the contract factory using the contract name
  const IPRegistry = await hre.ethers.getContractFactory("IPRegistry");
  
  // Deploy the contract instance
  const ipRegistry = await IPRegistry.deploy();
  
  // Wait for the transaction to be mined/confirmed
  await ipRegistry.waitForDeployment(); 

  // CRITICAL: Log the address for Member A
  console.log("Contract deployed to:", ipRegistry.target); 
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});