const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // The ultra-safe anchor from our last successful strike
    const anchor = `  const connectWallet = async () => {
    if ((window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const c = new ethers.Contract(MARKET_CONTRACT_ADDRESS, MARKET_ABI, signer);
      setContract(c as any);
      setAccount((await signer.getAddress()) as any);
    }
  };`;

    const web3ListingFunction = `
  // 🔥 WEB3 ACTION: DEPLOY LISTING TO MAINNET 🔥
  const executeWeb3Listing = async (priceStr: string, isUSDC: boolean, assetTypeStr: string, durationDays: number) => {
    if (!contract) {
      alert("⚠️ Access Denied: Connect your vault key (wallet) first.");
      return;
    }
    try {
      // 1. Format the Token Address
      const paymentToken = isUSDC ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" : "0x0000000000000000000000000000000000000000";
      
      // 2. Format the Asset Type (0: Physical, 1: NFT, 2: Bounty)
      let assetTypeNum = 0;
      if (assetTypeStr === 'digital') assetTypeNum = 1;
      if (assetTypeStr === 'bounty') assetTypeNum = 2;
      
      // 3. Parse the Price (USDC = 6 decimals, ETH = 18 decimals)
      const parsedPrice = isUSDC ? ethers.parseUnits(priceStr, 6) : ethers.parseEther(priceStr);
      
      // 4. Calculate the ETH Listing Fee
      let feeToSend = 0n;
      if (!isUSDC) {
        feeToSend = assetTypeNum === 0 ? ethers.parseEther("0.0015") : ethers.parseEther("0.002");
      }

      console.log("Transmitting to Base Mainnet...");
      
      // 5. Fire the Contract Function
      const tx = await (contract as any).listAsset(
        parsedPrice,
        paymentToken,
        assetTypeNum,
        "0x0000000000000000000000000000000000000000", // Stubbed NFT Contract
        0, // Stubbed Token ID
        durationDays,
        { value: feeToSend }
      );
      
      alert("🚀 Transmission Sent! Waiting for block confirmation...");
      await tx.wait();
      alert("✅ Vault Secured: Asset is officially live on Base Mainnet!");
      
    } catch (error: any) {
      console.error("Transmission Failed:", error);
      alert("❌ Error: " + (error.reason || error.message));
    }
  };`;

    if (code.includes(anchor) && !code.includes('executeWeb3Listing')) {
        code = code.replace(anchor, anchor + "\n\n" + web3ListingFunction);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ LOGIC INJECTED: Web3 Listing Engine is locked and loaded. UI untouched.");
    } else if (code.includes('executeWeb3Listing')) {
        console.log("⚠️ ALREADY INJECTED: The Web3 engine is already in the file.");
    } else {
        console.log("❌ SCRIPT FAULT: Could not find the exact anchor. Your UI is safe, nothing was changed.");
    }

} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
