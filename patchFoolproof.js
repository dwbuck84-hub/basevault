const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    const newEngines = `
  // 🔥 WEB3 ACTION: BUY NOW 🔥
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

  // 🔥 WEB3 ACTION: PLACE BID 🔥
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
    } else if (code.includes('const executeWeb3Listing')) {
        // Split the file exactly at the start of the listing engine and insert our new engines
        const parts = code.split('const executeWeb3Listing');
        code = parts[0] + newEngines + '\n  const executeWeb3Listing' + parts[1];
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ BULLETPROOF INJECTION: Buy Now and Bid engines successfully locked in.");
    } else {
        console.log("❌ SCRIPT FAULT: Could not find 'const executeWeb3Listing'.");
    }

} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
