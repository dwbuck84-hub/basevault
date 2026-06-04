const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    if (code.includes('window.ethereum')) {
        // Globally replace window.ethereum with the TS-bypassed version
        code = code.replace(/window\.ethereum/g, '(window as any).ethereum');
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ TYPESCRIPT FIXED: window.ethereum successfully bypassed.");
    } else {
        console.log("⚠️ TARGET EVADED: Could not find window.ethereum.");
    }

} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
