const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Revert the paymentToken logic to use ETH_ADDRESS (0x0) 
    // but ONLY for the listAsset function args
    const oldLogic = 'const paymentToken = isUsdc ? USDC_ADDRESS : NATIVE_ETH_ADDRESS;';
    const newLogic = 'const paymentToken = isUsdc ? USDC_ADDRESS : ETH_ADDRESS;';

    if (code.includes(oldLogic)) {
        code = code.replace(oldLogic, newLogic);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ PATCH COMPLETE: Payment token set to Zero Address (0x0) for listing.");
    } else {
        console.log("❌ SCRIPT FAULT: Could not find the paymentToken logic.");
    }
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
