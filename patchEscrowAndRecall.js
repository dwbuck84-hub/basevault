const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    const newLogic = `const handleSaveTracking = async () => {
    if(selectedItem && shippingLabelUrl) {
      try {
        await writeContractAsync({ address: VAULT_V5_ADDRESS as \`0x\${string}\`, abi: MARKETPLACE_V5_ABI, functionName: 'markShipped', args: [BigInt(selectedItem.id)] });
        await supabase.from(DB_TABLE).update({ tracking_info: fulfillmentTracking, shipping_label_url: shippingLabelUrl }).eq('id', selectedItem.id);
        alert("✅ TRANSIT BROADCAST LIVE & BLOCKCHAIN UPDATED.");
        if (typeof syncV5Ledger === 'function') syncV5Ledger();
      } catch(e: any) { alert("❌ Web3 Error: " + (e.reason || e.message)); }
    }
  };

  // 🔥 STRIKE 5: ESCROW LIFECYCLE CONTROLS 🔥
  const executeConfirmDelivery = async (id: number) => {
    try {
      await writeContractAsync({ address: VAULT_V5_ADDRESS as \`0x\${string}\`, abi: MARKETPLACE_V5_ABI, functionName: 'confirmDelivery', args: [BigInt(id)] });
      alert("✅ ESCROW RELEASED: Funds have been disbursed to the seller.");
      if (typeof syncV5Ledger === 'function') syncV5Ledger();
    } catch (e: any) { alert("❌ Error: " + (e.reason || e.message)); }
  };

  const executeFileDispute = async (id: number) => {
    try {
      await writeContractAsync({ address: VAULT_V5_ADDRESS as \`0x\${string}\`, abi: MARKETPLACE_V5_ABI, functionName: 'fileDispute', args: [BigInt(id)] });
      alert("⚠️ DISPUTE FILED: Escrow is locked pending admin review.");
      if (typeof syncV5Ledger === 'function') syncV5Ledger();
    } catch (e: any) { alert("❌ Error: " + (e.reason || e.message)); }
  };

  // 🔥 STRIKE 6: THE RECALL (CANCEL LISTING) 🔥
  const executeCancelListing = async (id: number, isUSDC: boolean) => {
    try {
      if (isUSDC) {
        await writeContractAsync({ address: USDC_ADDRESS as \`0x\${string}\`, abi: ERC20_ABI, functionName: 'approve', args: [VAULT_V5_ADDRESS, BigInt(2000000)] });
        await writeContractAsync({ address: VAULT_V5_ADDRESS as \`0x\${string}\`, abi: MARKETPLACE_V5_ABI, functionName: 'cancelListing', args: [BigInt(id)], value: 0n });
      } else {
        await writeContractAsync({ address: VAULT_V5_ADDRESS as \`0x\${string}\`, abi: MARKETPLACE_V5_ABI, functionName: 'cancelListing', args: [BigInt(id)], value: parseEther("0.002") });
      }
      alert("✅ LISTING CANCELLED: Item removed and fee collected.");
      if (typeof syncV5Ledger === 'function') syncV5Ledger();
    } catch (e: any) { alert("❌ Error: " + (e.reason || e.message)); }
  };

  `;

    const startMarker = 'const handleSaveTracking =';
    const endMarker = 'const handleRateUser =';

    const startIdx = code.indexOf(startMarker);
    const endIdx = code.indexOf(endMarker, startIdx);

    if (startIdx !== -1 && endIdx !== -1) {
        code = code.substring(0, startIdx) + newLogic + code.substring(endIdx);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ STRIKES 5 & 6 COMPLETED: Escrow Lifecycle and Cancel Logic wired directly to Wagmi.");
    } else {
        console.log("❌ SCRIPT FAULT: Could not find target markers.");
    }
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
