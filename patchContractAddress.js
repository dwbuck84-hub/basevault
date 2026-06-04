const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');
    const contractAddress = "0x8714D5f904a9D96db101CE03287Dd161BAD90ac5";
    const injection = `\n// 🔥 BASE MAINNET V5 CONTRACT 🔥\nconst MARKET_CONTRACT_ADDRESS = "${contractAddress}";\n`;

    // Check if we already have an address defined
    if (code.includes('MARKET_CONTRACT_ADDRESS')) {
        code = code.replace(/const MARKET_CONTRACT_ADDRESS = "[^"]+";/, `const MARKET_CONTRACT_ADDRESS = "${contractAddress}";`);
        console.log("✅ MAINNET LIVE: Contract address updated.");
    } else {
        // Inject right above the main export function so it's globally available
        const anchor = "export default function";
        if (code.includes(anchor)) {
            code = code.replace(anchor, injection + "\n" + anchor);
            console.log("✅ MAINNET LIVE: Contract address successfully injected.");
        } else {
            console.log("⚠️ TARGET EVADED: Could not find 'export default function'.");
        }
    }

    fs.writeFileSync('app/page.tsx', code, 'utf8');
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
