const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    const badLine = "const formatTimeLeft = (endTime) => {";
    const goodLine = "const formatTimeLeft = (endTime: any) => {";

    if (code.includes(badLine)) {
        code = code.replace(badLine, goodLine);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ TYPESCRIPT FIXED: Sledgehammer applied to endTime.");
    } else {
        console.log("⚠️ Target evaded: Could not find that exact line. Let me know if this happens!");
    }

} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
