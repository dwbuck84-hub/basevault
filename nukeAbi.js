const fs = require('fs');

try {
    const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');
    const newLines = [];
    let inCorruptedAbi = false;
    let injected = false;
    const newAbi = fs.readFileSync('contractAbi.json', 'utf8');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // 1. Lock onto the corrupted ABI
        if (trimmed.startsWith('const MARKETPLACE_V5_ABI') || trimmed.includes('const MARKETPLACE_V5_ABI =')) {
            inCorruptedAbi = true;
            if (!injected) {
                // Drop the clean V5.2 payload exactly once
                newLines.push('const MARKETPLACE_V5_ABI = ' + newAbi + ';');
                injected = true;
            }
            continue;
        }

        // 2. Vaporize the garbage trailing JSON
        if (inCorruptedAbi) {
            // Stop deleting ONLY when we hit actual React/TS code
            if (trimmed.match(/^(const|let|var|function|return|if|try|catch|await|export|import|interface)\b/)) {
                inCorruptedAbi = false;
                newLines.push(line);
            } else {
                continue; // Vaporize this line
            }
        } else {
            // Keep all normal code
            newLines.push(line);
        }
    }

    fs.writeFileSync('app/page.tsx', newLines.join('\n'), 'utf8');
    console.log("✅ MATRIX PURGE SUCCESSFUL: All corrupted JSON destroyed. V5.2 cleanly installed.");
} catch (e) {
    console.error("❌ FATAL ERROR:", e.message);
}
