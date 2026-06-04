const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    const pristineForge = `const handleCreateAuction = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!address) return alert("⚠️ Vault Key Required.");
    if (chainId !== base.id) return alert("⚠️ Switch network to Base Mainnet.");
    if (formType === 'tokenized_nft' && !isNftVerified) return alert("⚠️ Oracle verification required for NFTs.");
    
    setIsProcessing(true);
    try {
      const isUsdc = selectedCurrency === 'USDC';
      const parsedPrice = isUsdc ? parseUnits(formReservePrice, 6) : parseEther(formReservePrice);
      const paymentToken = isUsdc ? USDC_ADDRESS : ETH_ADDRESS;
      
      let assetTypeNum = 0;
      if (formType === 'digital') assetTypeNum = 1;
      if (formType === 'tokenized_nft') assetTypeNum = 2;
      
      let feeToSend = BigInt(0);
      if (!isUsdc) {
        feeToSend = assetTypeNum === 0 ? parseEther("0.0015") : parseEther("0.002");
      }
      
      const durationDays = Math.max(1, Math.floor(parseInt(formDuration) / 86400));
      const nftAddress = formType === 'tokenized_nft' ? nftContractAddress : ETH_ADDRESS;
      const tId = formType === 'tokenized_nft' ? BigInt(nftTokenId || 0) : BigInt(0);

      console.log("Transmitting Listing to Base Mainnet...");
      await writeContractAsync({
        address: VAULT_V5_ADDRESS as \`0x\${string}\`,
        abi: MARKETPLACE_V5_ABI,
        functionName: 'listAsset',
        args: [parsedPrice, paymentToken, assetTypeNum, nftAddress, tId, BigInt(durationDays)],
        value: feeToSend
      });

      console.log("On-chain transmission complete. Writing to decentralized matrix...");
      const dbRecord = {
        title: formTitle,
        description: formDescription,
        category: formCategory,
        type: formType,
        reservePrice: formReservePrice,
        paymentToken: paymentToken,
        seller: address,
        highestBidder: ETH_ADDRESS,
        highestBid: "0",
        auctionEndTime: Math.floor(Date.now() / 1000) + parseInt(formDuration),
        status: 0,
        images: uploadedImageUrls,
        nftContract: nftAddress,
        tokenId: Number(tId)
      };
      
      await supabase.from(DB_TABLE).insert([dbRecord]);
      alert("✅ Genesis Forge Complete: Asset is officially live on Base Mainnet!");
      
      setActiveTab('browse');
      if (typeof syncV5Ledger === 'function') syncV5Ledger();
    } catch (err: any) { 
      console.error(err);
      alert("❌ Forge Failed: " + (err.shortMessage || err.message)); 
    }
    setIsProcessing(false);
  };

  `;

    const startIdx = code.indexOf('const handleCreateAuction = async');
    const endIdx = code.indexOf('return (', startIdx);

    if (startIdx !== -1 && endIdx !== -1) {
        code = code.substring(0, startIdx) + pristineForge + code.substring(endIdx);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ FORGE RESTORED: The corrupted Create Listing function was amputated and rebuilt for Mainnet.");
    } else {
        console.log("❌ SCRIPT FAULT: Could not locate the bounds to replace.");
    }
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
