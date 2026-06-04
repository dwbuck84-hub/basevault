const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    const badLine = "setAccount(await signer.getAddress());";
    const goodLine = "setAccount((await signer.getAddress()) as any);";

    if (code.includes(badLine)) {
        code = code.replace(badLine, goodLine);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ TYPESCRIPT FIXED: setAccount sledgehammer applied.");
    } else {
        console.log("⚠️ TARGET EVADED: Could not find that exact line. Let me know if this happens!");
    }

} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
