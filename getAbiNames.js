const fs = require('fs');

try {
    const code = fs.readFileSync('app/page.tsx', 'utf8');

    // Brute-force match ANY string that comes after 'name:' or '"name":'
    const regex = /(?:["']?name["']?\s*:\s*["']([^"']+)["'])/g;
    let match;
    const names = new Set();

    while ((match = regex.exec(code)) !== null) {
        names.add(match[1]);
    }

    const allNames = Array.from(names);
    
    // Filter down to the most likely suspects
    const suspects = allNames.filter(n => 
        n.toLowerCase().includes('count') || 
        n.toLowerCase().includes('total') || 
        n.toLowerCase().includes('item') ||
        n.toLowerCase().includes('list')
    );

    console.log("\n🔍 HIGH PROBABILITY VARIABLES:");
    console.log(suspects.length > 0 ? suspects.join(', ') : "None found. Dumping all functions...");
    
    if (suspects.length === 0) {
        console.log("\n📄 ALL FUNCTIONS IN ABI:");
        console.log(allNames.join(', '));
    }
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
