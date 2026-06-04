const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Hunt down your original Supabase database insert so we don't lose your fields
    let dbInsertBlock = '';
    const dbMatch = code.match(/await\s+supabase\.from\(DB_TABLE\)\.insert\(\[\{[\s\S]*?\}\]\);/);
    if (dbMatch) {
        dbInsertBlock = dbMatch[0];
    } else {
        console.log("⚠️ Warning: Could not find exact database block, using standard payload.");
        dbInsertBlock = `await supabase.from(DB_TABLE).insert([{ title: formTitle, description: formDescription, category: formCategory, images: uploadedImageUrls, premium_shipping: usePremiumShipping, sale_mode: saleMode, reservePrice: formReservePrice, paymentToken: selectedCurrency === 'USDC' ? USDC_ADDRESS : ETH_ADDRESS, type: formType, seller: address }]);`;
    }

    // 2. The Pristine V5.2 Engine
    const pristineEngine = `
  // V5.2 Pristine Deployment Engine
  const handleDeployAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const isUsdc = selectedCurrency === 'USDC';
      const reserveWei = isUsdc ? parseUnits(formReservePrice, 6) : parseEther(formReservePrice);
      
      // Matrix Fee Calculation
      const isPhysical = formType === 'physical';
      const listingFee = isPhysical ? 1500000000000000n : 2000000000000000n; // 0.0015 or 0.002 ETH

      // Execute On-Chain Router
      await writeContractAsync({
        address: VAULT_V5_ADDRESS as \`0x\${string}\`,
        abi: MARKETPLACE_V5_ABI,
        functionName: 'listItem',
        args: ["BaseVault Asset", reserveWei, isUsdc ? USDC_ADDRESS : ETH_ADDRESS, isPhysical],
        value: listingFee
      });

      // Synchronize Ledger
      ${dbInsertBlock}

      alert("✅ ASSET LAUNCHED ON THE V5.2 MATRIX.");
      if (typeof syncV5Ledger === 'function') syncV5Ledger();
      setActiveTab('browse');
    } catch (err: any) {
      alert(\`Launch Failed: \${err.shortMessage || err.message}\`);
    } finally {
      setIsProcessing(false);
    }
  };\n\n  const handleCreateAuction`;

    // 3. Inject the clean engine and orphan the corrupted one
    if (!code.includes('const handleDeployAsset =')) {
        code = code.replace('const handleCreateAuction', pristineEngine);
    }

    // 4. Rewire the button strictly to the new engine
    code = code.replace(/<form onSubmit=\{handleCreateAuction\}/g, '<form onSubmit={handleDeployAsset}');

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ LAUNCH PROTOCOL FIXED: Button wired to pristine V5.2 Deployment Engine.");
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
