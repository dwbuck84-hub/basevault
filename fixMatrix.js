const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Destroy the abort kill-switch. Force a manual 50-slot grid scan.
    code = code.replace(
        /catch\(e: any\) \{ console\.error\("❌ SMART CONTRACT ABORT:"[\s\S]*?return; \}/g,
        `catch(e: any) { console.error("⚠️ COUNTER REVERTED. ENGAGING MANUAL SCAN."); counter = BigInt(50); }`
    );

    // 2. Point to the correct 'items' ledger found in the ABI dump
    code = code.replace(
        /functionName: 'auctions'/g, 
        "functionName: 'items'"
    );

    // 3. Wagmi Safety Net: Handle array-based ABI returns just in case V5.2 removed named variables
    code = code.replace(
        /if \(\!rawAuc \|\| rawAuc\.seller === ETH_ADDRESS\) continue;/g,
        `let currentSeller = rawAuc.seller || rawAuc[0];\n          if (!rawAuc || !currentSeller || currentSeller === '0x0000000000000000000000000000000000000000' || currentSeller === ETH_ADDRESS) continue;\n          rawAuc.seller = currentSeller;`
    );

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ MATRIX OVERRIDE ENGAGED: Counter bypassed, ledger synced.");
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
