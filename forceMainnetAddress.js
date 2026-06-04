const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Nuke any instance of the old address variable and lock in the real one
    code = code.replace(/const VAULT_V5_ADDRESS\s*=\s*["'].*?["']/g, 'const VAULT_V5_ADDRESS = "0xA2ed6A0b531A94799397b4CF2dd29a945D3F0323"');
    
    // Double check that we didn't leave any rogue string definitions
    code = code.replace(/0x1EB0A.*?[bB]1[eE][fF][fF]/g, '0xA2ed6A0b531A94799397b4CF2dd29a945D3F0323');

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ CONTRACT REALIGNED: Every reference forced to Mainnet contract 0xA2ed...");
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
