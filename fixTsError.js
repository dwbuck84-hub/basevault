const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Add ': any' to the catch blocks to satisfy the strict compiler
    code = code.replace(
        /catch\(e\) { console\.error\("❌ SMART CONTRACT ABORT:"/g,
        `catch(e: any) { console.error("❌ SMART CONTRACT ABORT:"`
    );

    code = code.replace(
        /catch \(err\) { console\.error\("❌ ITEM FETCH CRASH:"/g,
        `catch(err: any) { console.error("❌ ITEM FETCH CRASH:"`
    );

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ TYPESCRIPT REPAIRED: Telemetry variables casted as 'any'.");
} catch(e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
