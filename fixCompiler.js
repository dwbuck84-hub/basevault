const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Strip out the cache-killers that broke the Client Component
    code = code.replace(/export const dynamic = ['"]force-dynamic['"];?\n?/g, '');
    code = code.replace(/export const fetchCache = ['"]force-no-store['"];?\n?/g, '');
    code = code.replace(/export const revalidate = 0;?\n?/g, '');
    
    // 2. Strip out any existing 'use client' strings so we don't duplicate
    code = code.replace(/['"]use client['"];?\n?/g, '');

    // 3. Lock 'use client' to the absolute top of the file
    code = `'use client';\n\n` + code.trimStart();

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ PAGE REPAIRED: 'use client' directive locked to line 1.");

    // 4. Move the cache-killer to layout.tsx where Next.js actually allows it
    if (fs.existsSync('app/layout.tsx')) {
        let layoutCode = fs.readFileSync('app/layout.tsx', 'utf8');
        if (!layoutCode.includes('force-dynamic')) {
            layoutCode = `export const dynamic = 'force-dynamic';\n` + layoutCode;
            fs.writeFileSync('app/layout.tsx', layoutCode, 'utf8');
            console.log("✅ CACHE ANNIHILATED: Forced dynamic rendering moved to layout.tsx.");
        }
    } else {
        console.log("⚠️ No layout.tsx found, skipping layout injection.");
    }

} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
