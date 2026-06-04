const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Nuke the old dynamic route if it's there
    code = code.replace(/export const dynamic = 'force-dynamic';\n/g, '');
    
    // Inject the absolute hardest cache-kill configurations Next.js allows
    const cacheKillers = `export const dynamic = 'force-dynamic';\nexport const fetchCache = 'force-no-store';\nexport const revalidate = 0;\n`;
    
    code = cacheKillers + code;

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ DATA CACHE ANNIHILATED: Next.js will now pull fresh Supabase data on every load.");
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
