const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // If the dynamic override isn't there, inject it at the very top
    if (!code.includes('export const dynamic')) {
        code = `export const dynamic = 'force-dynamic';\n` + code;
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ STATIC CACHE KILLED: Next.js forced to render dynamically and accept our headers.");
    } else {
        console.log("⚠️ Page is already dynamic.");
    }
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
