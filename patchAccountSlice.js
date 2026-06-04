const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    if (code.includes('account.slice(')) {
        // Force TypeScript to treat account as a String before slicing
        code = code.replace(/account\.slice\(/g, 'String(account).slice(');
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ TYPESCRIPT FIXED: Wallet display sledgehammer applied.");
    } else {
        console.log("⚠️ TARGET EVADED: Could not find account.slice.");
    }

} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
