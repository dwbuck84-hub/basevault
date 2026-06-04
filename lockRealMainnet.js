const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Nuke whatever address is currently there and lock in the real one
    code = code.replace(/const VAULT_V5_ADDRESS\s*=\s*["'][^"']*["']/g, 'const VAULT_V5_ADDRESS = "0x2adaFC22ab3AE4587c86c7e4FE4b6E325Ed51906"');

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ MATRIX REALIGNED: Live Mainnet coordinates locked to 0x2adaFC22ab3AE4587c86c7e4FE4b6E325Ed51906.");
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
