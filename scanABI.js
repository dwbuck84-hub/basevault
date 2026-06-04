const fs = require('fs');
const path = require('path');

function search(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (!fullPath.includes('node_modules') && !fullPath.includes('.next') && !fullPath.includes('.git')) {
                search(fullPath);
            }
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('MARKETPLACE_V5_ABI')) {
                console.log(`\n✅ ABI LOCATION: ${fullPath}`);
                const matches = content.match(/name\s*:\s*['"]([^'"]+)['"]/g);
                if (matches) {
                    const names = matches.map(m => m.match(/['"]([^'"]+)['"]/)[1]);
                    const potentials = names.filter(n => 
                        n.toLowerCase().includes('count') || 
                        n.toLowerCase().includes('total') || 
                        n.toLowerCase().includes('length') ||
                        n.toLowerCase().includes('auction') || 
                        n.toLowerCase().includes('list')
                    );
                    console.log(`🔍 POTENTIAL COUNTERS:`, [...new Set(potentials)]);
                }
            }
        }
    });
}
console.log("Scanning matrix for V5.2 ABI...");
search('./');
