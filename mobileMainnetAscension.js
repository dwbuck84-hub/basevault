const fs = require('fs');

try {
    let code = fs.readFileSync('App.tsx', 'utf8');

    // Swap the Wagmi import
    code = code.replace(/import\s*\{\s*baseSepolia\s*\}\s*from\s*'wagmi\/chains';/g, "import { base } from 'wagmi/chains';");
    
    // Swap the active chain array
    code = code.replace(/const\s+chains\s*=\s*\[baseSepolia\];/g, "const chains = [base];");

    fs.writeFileSync('App.tsx', code, 'utf8');
    console.log("✅ MOBILE GRID LOCKED: Expo app is now routed to Base Mainnet.");
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
