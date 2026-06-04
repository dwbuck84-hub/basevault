const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    if (code.includes('0n')) {
        // Swap the modern literal for the classic constructor
        code = code.replace(/0n/g, "BigInt(0)");
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ TYPESCRIPT BYPASSED: BigInt literals downgraded for compiler compatibility.");
    } else {
        console.log("⚠️ TARGET EVADED: Could not find '0n'.");
    }

} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
