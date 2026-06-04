const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');
    
    // Swap the Wagmi network imports and chain checks
    code = code.replace(/baseSepolia/g, 'base');
    code = code.replace(/Base Sepolia Testnet/gi, 'Base Mainnet');

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ WEB GRID LOCKED: Next.js is now routed to Base Mainnet.");
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
