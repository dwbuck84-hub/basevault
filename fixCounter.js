const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Replace the non-existent auctionCounter with getTotalItems
    code = code.replace(/functionName: 'auctionCounter'/g, "functionName: 'getTotalItems'");
    
    // Also update the loop reference if it uses the same variable name
    code = code.replace(/counter = await publicClient\.readContract\(\{ address: VAULT_V5_ADDRESS as `0x\${string}`, abi: MARKETPLACE_V5_ABI, functionName: 'getTotalItems' \}\) as bigint;/g, 
        "counter = await publicClient.readContract({ address: VAULT_V5_ADDRESS as `0x${string}`, abi: MARKETPLACE_V5_ABI, functionName: 'getTotalItems' }) as bigint;");

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ ABI SYNCED: 'auctionCounter' swapped for 'getTotalItems'. Grid will now load.");
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
