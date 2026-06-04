const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');
    
    const engines = `
  // 🔥 WEB3 ENGINES: LISTING, BUY, BID 🔥
  const executeWeb3Listing = async (priceStr: string, isUSDC: boolean, assetTypeStr: string, durationDays: number) => {
    if (!contract) return alert("⚠️ Vault Key Required: Connect your vault key (wallet) first.");
    try {
      const paymentToken = isUSDC ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" : "0x0000000000000000000000000000000000000000";
      let assetTypeNum = 0;
      if (assetTypeStr === 'digital') assetTypeNum = 1;
      if (assetTypeStr === 'bounty') assetTypeNum = 2;
      
      const parsedPrice = isUSDC ? ethers.parseUnits(priceStr, 6) : ethers.parseEther(priceStr);
      let feeToSend = 0n;
      if (!isUSDC) {
        feeToSend = assetTypeNum === 0 ? ethers.parseEther("0.0015") : ethers.parseEther("0.002");
      }

      console.log("Transmitting to Base Mainnet...");
      const tx = await (contract as any).listAsset(parsedPrice, paymentToken, assetTypeNum, "0x0000000000000000000000000000000000000000", 0, durationDays, { value: feeToSend });
      
      alert("🚀 Transmission Sent! Waiting for block confirmation...");
      await tx.wait();
      alert("✅ Vault Secured: Asset is officially live on Base Mainnet!");
    } catch (error: any) {
      console.error("Transmission Failed:", error);
      alert("❌ Error: " + (error.reason || error.message));
    }
  };

  const executeBuyNow = async (listingId: number, priceStr: string, isUSDC: boolean) => {
    if (!contract) return alert("⚠️ Vault Key Required: Connect your wallet first.");
    try {
      const parsedPrice = isUSDC ? ethers.parseUnits(priceStr, 6) : ethers.parseEther(priceStr);
      console.log("Transmitting Buy Now order...");
      const tx = await (contract as any).buyNow(listingId, { value: isUSDC ? 0n : parsedPrice });
      alert("🚀 Transaction Sent! Awaiting block confirmation...");
      await tx.wait();
      alert("✅ Item Secured! The funds have been locked in escrow.");
    } catch (error: any) {
      console.error("Buy Now Failed:", error);
      alert("❌ Error: " + (error.reason || error.message));
    }
  };

  const executeBid = async (listingId: number, bidAmountStr: string, isUSDC: boolean) => {
    if (!contract) return alert("⚠️ Vault Key Required: Connect your wallet first.");
    try {
      const parsedBid = isUSDC ? ethers.parseUnits(bidAmountStr, 6) : ethers.parseEther(bidAmountStr);
      let feeToSend = isUSDC ? 0n : parsedBid + ethers.parseEther("0.00001");
      console.log("Transmitting Bid...");
      const tx = await (contract as any).placeBid(listingId, parsedBid, { value: feeToSend });
      alert("🚀 Bid Transmitted! Awaiting block confirmation...");
      await tx.wait();
      alert("✅ Confirmed: You are now the highest bidder!");
    } catch (error: any) {
      console.error("Bid Failed:", error);
      alert("❌ Error: " + (error.reason || error.message));
    }
  };
`;

    if (code.includes('executeBuyNow')) {
        console.log("⚠️ ALREADY INJECTED: The engines are already in the file.");
    } else {
        // Find the absolute lowest-level index of 'const connectWallet'
        const idx = code.indexOf('const connectWallet');
        if (idx !== -1) {
            // Find the newline right before it to cleanly inject
            const lastNewline = code.lastIndexOf('\n', idx);
            code = code.slice(0, lastNewline + 1) + engines + '\n' + code.slice(lastNewline + 1);
            fs.writeFileSync('app/page.tsx', code, 'utf8');
            console.log("✅ TERMINAL HACK SUCCESS: All 3 Web3 engines injected flawlessly.");
        } else {
            console.log("❌ SCRIPT FAULT: Could not find ANY trace of connectWallet.");
        }
    }
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
