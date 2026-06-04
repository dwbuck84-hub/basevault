const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Inject a hard cache-clear and page reload right after the success alert
    code = code.replace(
        /alert\("✅ ASSET LAUNCHED ON THE V5\.2 MATRIX\."\);/g, 
        'alert("✅ ASSET LAUNCHED ON THE V5.2 MATRIX.");\n      window.location.reload();'
    );

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ UI SYNCHRONIZED: App will now auto-refresh to pull fresh ledger data.");
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
