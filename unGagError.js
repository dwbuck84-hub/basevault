const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Find the silent Supabase insert and wrap it to capture the error object
    const regex = /await supabase\.from\(DB_TABLE\)\.insert\(\[\{[\s\S]*?\}\]\);/g;

    let modified = false;
    code = code.replace(regex, (match) => {
        if (match.includes("dbError")) return match; // Prevent double injection
        modified = true;
        return `const { error: dbError } = ${match}\n      if (dbError) throw new Error("Supabase Rejected Data: " + dbError.message);`;
    });

    if (modified) {
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ SILENCER REMOVED: Supabase database errors will now trigger the UI alert.");
    } else {
        console.log("⚠️ Could not locate the exact insert string.");
    }
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
