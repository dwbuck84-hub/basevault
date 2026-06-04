const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    const target = 'const { writeContractAsync } = useWriteContract();';
    
    const restoredLogic = `
  // V5.2 Restored Purchase Engine
  const handlePlaceBid = async () => {
    if (!selectedItem) return;
    const finalAmountToUse = selectedItem.saleMode === 'fixed' ? selectedItem.reservePrice : bidInput;
    if (!finalAmountToUse) return alert("Allocation parameter missing.");

    setIsProcessing(true);
    try {
      const isUsdc = selectedItem.paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase();
      const bidWei = isUsdc ? parseUnits(finalAmountToUse, 6) : parseEther(finalAmountToUse);
      
      if (isUsdc) {
        // Step 1: Approve USDC router
        await writeContractAsync({ address: USDC_ADDRESS as \`0x\${string}\`, abi: ERC20_ABI, functionName: 'approve', args: [VAULT_V5_ADDRESS, bidWei] });
        // Step 2: Lock into Matrix Escrow
        await writeContractAsync({ address: VAULT_V5_ADDRESS as \`0x\${string}\`, abi: MARKETPLACE_V5_ABI, functionName: 'purchaseItem', args: [BigInt(selectedItem.id)] });
      } else {
        // Native ETH instant routing
        await writeContractAsync({ address: VAULT_V5_ADDRESS as \`0x\${string}\`, abi: MARKETPLACE_V5_ABI, functionName: 'purchaseItem', args: [BigInt(selectedItem.id)], value: bidWei });
      }
      
      if (selectedItem.type === 'physical') {
        await supabase.from(DB_TABLE).update({ selected_shipping_option: chosenShippingTier }).eq('id', selectedItem.id);
      }
      
      alert("✅ TRANSACTION CONFIRMED: Escrow Locked.");
      setSelectedItem(null);
      setBidInput('');
      syncV5Ledger();
    } catch (err: any) { 
      alert(\`Rejected: \${err.shortMessage || err.message}\`); 
    } finally { 
      setIsProcessing(false); 
    }
  };`;

    if (!code.includes('const handlePlaceBid =')) {
        code = code.replace(target, target + '\n' + restoredLogic);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ TRANSACTION ENGINE RESTORED: 'handlePlaceBid' is online and wired for V5.2 routing.");
    } else {
        console.log("ℹ️ Engine already present in file.");
    }
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
