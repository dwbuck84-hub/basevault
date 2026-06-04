const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Strip the 'n' literal and wrap in standard BigInt constructor
    code = code.replace(/1500000000000000n/g, 'BigInt("1500000000000000")');
    code = code.replace(/2000000000000000n/g, 'BigInt("2000000000000000")');

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ COMPILER BYPASS: BigInt syntax upgraded to silence strictness warnings.");
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
