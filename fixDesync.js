const fs = require('fs');
try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Destroy the broken Map architecture and use an Array
    code = code.replace(/let supabaseMetaMap = new Map\(\);/g, "let supabaseRecords = [];");
    code = code.replace(/if \(dbData\) dbData\.forEach\(i => \{ supabaseMetaMap\.set\(Number\(i\.id\), i\); \}\);/g, "if (dbData) supabaseRecords = dbData;");

    // 2. Instruct the UI to match the blockchain data to Supabase using the Wallet Address
    code = code.replace(/(const|let) meta = supabaseMetaMap\.get[^;]+;/g, "const meta = supabaseRecords.find(m => m.seller && m.seller.toLowerCase() === rawAuc.seller.toLowerCase()) || {};");

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ LEDGER SYNCED: Frontend will now match assets via Wallet Address, completely bypassing the ID mismatch.");
} catch(e) { console.error("❌ SCRIPT FAULT:", e.message); }
