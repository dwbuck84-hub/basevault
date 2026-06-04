const fs = require('fs');
try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');
    
    // Replace the fragile image mapping with a bulletproof parser
    const oldImg = "images: dbItem.images && dbItem.images.length > 0 ? dbItem.images : [],";
    const newImg = `images: Array.isArray(dbItem.images) ? dbItem.images : (typeof dbItem.images === 'string' ? (dbItem.images.startsWith('[') ? JSON.parse(dbItem.images) : [dbItem.images]) : ["https://placehold.co/600x400/131b30/10b981?text=ASSET+SECURED"]),`;
    
    if(code.includes(oldImg)) {
        code = code.replace(oldImg, newImg);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ IMAGE PARSER UPGRADED: Format stabilized.");
    } else {
        console.log("⚠️ Could not find exact string. Already patched?");
    }
} catch(e) { console.error("❌ SCRIPT FAULT:", e.message); }
