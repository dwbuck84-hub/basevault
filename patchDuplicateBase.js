const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    const duplicateImport = "import { base } from 'viem/chains';";
    
    if (code.includes(duplicateImport)) {
        // Wipe the duplicate import completely
        code = code.replace(duplicateImport, "");
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ COMPILER FIXED: Duplicate 'base' import neutralized.");
    } else {
        // Fallback: Use Regex to find any stray viem/chains base import and kill it
        const regex = /import\s*\{\s*base\s*\}\s*from\s*['"]viem\/chains['"];?\n?/;
        if (regex.test(code)) {
            code = code.replace(regex, "");
            fs.writeFileSync('app/page.tsx', code, 'utf8');
            console.log("✅ COMPILER FIXED: Duplicate 'base' import hunted down and neutralized.");
        } else {
            console.log("❌ SCRIPT FAULT: Could not find the duplicate import. You might have to manually delete one of the 'import { base }' lines at the top of your file.");
        }
    }

} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
