const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Lower the scan ceiling so we don't fetch unnecessary empty slots
    code = code.replace(/counter = BigInt\(50\);/g, "counter = BigInt(15);");
    
    // 2. Inject the 150ms stealth throttle at the start of the fetch loop
    code = code.replace(
        /for \(let i = BigInt\(1\); i <= counter; i\+\+\) \{/g,
        `for (let i = BigInt(1); i <= counter; i++) {\n        await new Promise(r => setTimeout(r, 150)); // RPC Stealth Throttle`
    );

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ STEALTH ENGAGED: Loop throttled. Base Mainnet DDoS shields bypassed.");
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
