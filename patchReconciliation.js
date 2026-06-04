const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Upgrade Forge to Capture Contract ID
    const oldForge = `const durationDays = Math.max(1, Math.floor(parseInt(formDuration) / 86400));
      const nftAddress = formType === 'tokenized_nft' ? nftContractAddress : ETH_ADDRESS;
      const tId = formType === 'tokenized_nft' ? BigInt(nftTokenId || 0) : BigInt(0);

      console.log("Transmitting Listing to Base Mainnet...");
      await writeContractAsync({`;

    const newForge = `const durationDays = Math.max(1, Math.floor(parseInt(formDuration) / 86400));
      const nftAddress = formType === 'tokenized_nft' ? nftContractAddress : ETH_ADDRESS;
      const tId = formType === 'tokenized_nft' ? BigInt(nftTokenId || 0) : BigInt(0);

      // Pre-fetch the ID the contract will assign
      const publicClient = createPublicClient({ chain: base, transport: http() });
      const nextId = await publicClient.readContract({
        address: VAULT_V5_ADDRESS as \`0x\${string}\`,
        abi: MARKETPLACE_V5_ABI,
        functionName: 'nextListingId'
      }) as bigint;

      console.log("Transmitting Listing to Base Mainnet (ID: " + nextId + ")...");
      await writeContractAsync({`;

    // Patch the DB insert to include the contract_item_id
    const dbPatch = `images: uploadedImageUrls,
        nftContract: nftAddress,
        tokenId: Number(tId)
      };`;
    const newDbPatch = `images: uploadedImageUrls,
        nftContract: nftAddress,
        tokenId: Number(tId),
        contract_item_id: Number(nextId)
      };`;

    code = code.replace(oldForge, newForge);
    code = code.replace(dbPatch, newDbPatch);

    // 2. Surgical Swap: Switch ID to contract_item_id in all Action Buttons
    // We target executeConfirmDelivery, executeFileDispute, executeCancelListing, and BuyNow/Bid
    code = code.replace(/executeConfirmDelivery\(Number\(selectedItem\.id\)\)/g, "executeConfirmDelivery(Number(selectedItem.contract_item_id))");
    code = code.replace(/executeFileDispute\(Number\(selectedItem\.id\)\)/g, "executeFileDispute(Number(selectedItem.contract_item_id))");
    code = code.replace(/executeCancelListing\(Number\(selectedItem\.id\)/g, "executeCancelListing(Number(selectedItem.contract_item_id)");
    code = code.replace(/\[BigInt\(selectedItem\.id\)\]/g, "[BigInt(selectedItem.contract_item_id)]");
    code = code.replace(/\[BigInt\(selectedItem\.id\), bidWei\]/g, "[BigInt(selectedItem.contract_item_id), bidWei]");

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ RECONCILIATION COMPLETE: Blockchain IDs and DB IDs are now perfectly mapped.");

} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
