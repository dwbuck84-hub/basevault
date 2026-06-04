const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Un-gag the Supabase Read (Line 339)
    code = code.replace(
        `const { data: dbData } = await supabase.from(DB_TABLE).select('*').limit(1000);`,
        `const { data: dbData, error: readErr } = await supabase.from(DB_TABLE).select('*').limit(1000);\n        if (readErr) console.error("❌ SUPABASE DENIED:", readErr.message);\n        console.log("✅ SUPABASE ROWS LOADED:", dbData ? dbData.length : 0);`
    );

    // 2. Un-gag the Smart Contract Counter (Line 344)
    // If this fails, the entire page silently aborts.
    code = code.replace(
        `} catch(e) { return; }`,
        `} catch(e) { console.error("❌ SMART CONTRACT ABORT:", e.shortMessage || e.message || e); return; }`
    );

    // 3. Un-gag the Item Fetch Loop (Line 365)
    code = code.replace(
        `} catch (err) {}`,
        `} catch (err) { console.error("❌ ITEM FETCH CRASH:", err.shortMessage || err.message || err); }`
    );

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ TELEMETRY INJECTED: The UI will now log exact read errors.");
} catch(e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
