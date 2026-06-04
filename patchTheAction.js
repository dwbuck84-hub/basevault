const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // The safe anchor: the very end of the executeWeb3Listing function
    const anchor = `alert("❌ Error: " + (error.reason || error.message));
    }
  };`;

    const actionFunctions = `

  // 🔥 WEB3 ACTION: BUY NOW 🔥
  const executeBuyNow = async (listingId: number, priceStr: string, isUSDC: boolean) => {
    if (!contract) return alert("⚠️ Vault Key Required: Connect your wallet first.");
    try {
      const parsedPrice = isUSDC ? ethers.parseUnits(priceStr, 6) : ethers.parseEther(priceStr);
      
      console.log("Transmitting Buy Now order to Base Mainnet...");
      
      // Note: If USDC, the user must have already called approve() on the USDC contract.
      // We are passing 0 ETH for USDC, and the full ETH amount for ETH purchases.
      const tx = await (contract as any).buyNow(listingId, { value: isUSDC ? 0n : parsedPrice });
      
      alert("🚀 Transaction Sent! Awaiting block confirmation...");
      await tx.wait();
      alert("✅ Item Secured! The funds have been locked in escrow.");
    } catch (error: any) {
      console.error("Buy Now Failed:", error);
      alert("❌ Error: " + (error.reason || error.message));
    }
  };

  // 🔥 WEB3 ACTION: PLACE BID 🔥
  const executeBid = async (listingId: number, bidAmountStr: string, isUSDC: boolean) => {
    if (!contract) return alert("⚠️ Vault Key Required: Connect your wallet first.");
    try {
      const parsedBid = isUSDC ? ethers.parseUnits(bidAmountStr, 6) : ethers.parseEther(bidAmountStr);
      
      // Calculate the total ETH to send (Bid Amount + 3-Cent Spam Fee)
      // For this UI logic, we approximate 3 cents as 0.00001 ETH to ensure it clears the contract requirement
      let feeToSend = isUSDC ? 0n : parsedBid + ethers.parseEther("0.00001");

      console.log("Transmitting Bid to Base Mainnet...");
      const tx = await (contract as any).placeBid(listingId, parsedBid, { value: feeToSend });
      
      alert("🚀 Bid Transmitted! Awaiting block confirmation...");
      await tx.wait();
      alert("✅ Confirmed: You are now the highest bidder!");
    } catch (error: any) {
      console.error("Bid Failed:", error);
      alert("❌ Error: " + (error.reason || error.message));
    }
  };`;

    if (code.includes(anchor) && !code.includes('executeBuyNow')) {
        code = code.replace(anchor, anchor + actionFunctions);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ THE ACTION INJECTED: Buy Now & Bid engines are live. UI is completely untouched.");
    } else if (code.includes('executeBuyNow')) {
        console.log("⚠️ ALREADY INJECTED: The Web3 action engines are already in the file.");
    } else {
        console.log("❌ SCRIPT FAULT: Could not find the exact anchor. Your UI is safe, nothing was changed.");
    }

} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
