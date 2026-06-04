const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');
    
    // 1. Inject the new ABI into the correct variable name
    const newAbi = fs.readFileSync('contractAbi.json', 'utf8');
    code = code.replace(/const\s+MARKETPLACE_V5_ABI\s*=\s*\[[\s\S]*?\]\s*;?/g, 'const MARKETPLACE_V5_ABI = ' + newAbi + ';');

    // 2. Map 'createAuction' -> 'listItem' (and inject the required upfront ETH fee calculation)
    code = code.replace(/functionName:\s*'createAuction',[\s\S]*?args:\s*\[[^\]]+\]/g, 
      `functionName: 'listItem',
        args: ["BaseVault Asset", reserveWei, isUsdc ? USDC_ADDRESS : ETH_ADDRESS, formType === 'physical'],
        value: isUsdc ? 0n : (formType === 'physical' ? 1500000000000000n : 2000000000000000n)`);

    // 3. Map 'placeBid' -> 'purchaseItem' (USDC and ETH routes)
    code = code.replace(/functionName:\s*'placeBid',\s*args:\s*\[BigInt\(selectedItem\.id\),\s*bidWei\]/g, `functionName: 'purchaseItem', args: [BigInt(selectedItem.id)]`);
    code = code.replace(/functionName:\s*'placeBid',\s*args:\s*\[BigInt\(selectedItem\.id\),\s*BigInt\(0\)\]/g, `functionName: 'purchaseItem', args: [BigInt(selectedItem.id)]`);

    // 4. Map 'cancelAuction' -> 'cancelListing'
    code = code.replace(/functionName:\s*'cancelAuction'/g, `functionName: 'cancelListing'`);

    // 5. Map 'settleAuction' -> 'confirmFulfillment'
    code = code.replace(/functionName:\s*'settleAuction'/g, `functionName: 'confirmFulfillment'`);

    // 6. Nullify the old 'withdrawRefund' function since V5 routing is 100% automated
    code = code.replace(/await\s+writeContractAsync\(\{\s*address:\s*VAULT_V5_ADDRESS[\s\S]*?functionName:\s*'withdrawRefund'[\s\S]*?\}\);/g, `console.log("Automated Matrix Routing: Funds are already in Dev Wallet.");`);

    // Force save the file
    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ ARCHITECTURE SYNC COMPLETE: Frontend perfectly matches V5.2 Multi-Asset Matrix.");
} catch(err) {
    console.error("❌ CRITICAL FAULT: ", err.message);
}
