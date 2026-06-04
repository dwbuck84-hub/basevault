const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Lock onto the exact duplicate state block we injected
    const targetBlock = /\/\/\s*Restored Cryptographic Verification Hook\s*const\s*\[isVerifyingNft,\s*setIsVerifyingNft\]\s*=\s*useState\(false\);\s*const\s*\[isNftVerified,\s*setIsNftVerified\]\s*=\s*useState\(false\);/g;

    if (targetBlock.test(code)) {
        // Strip out the duplicate state hooks, leave the comment and function below it
        code = code.replace(targetBlock, "// Restored Cryptographic Verification Hook");
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ REDECLARATION CLEARED: Duplicate state hooks purged.");
    } else {
        console.log("⚠️ WARNING: Could not find the duplicate block. File may have been altered.");
    }
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
