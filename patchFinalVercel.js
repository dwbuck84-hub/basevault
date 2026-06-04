const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Sort State
    if (!code.includes('sortOrder')) {
        code = code.replace(/(const \[[^\]]+\] = useState[^;]+;)/, "$1\n  const [sortOrder, setSortOrder] = useState('newest');");
    }

    // 2. Button Logic (with TS bypass sledgehammer)
    if (!code.includes("(formType as string) !== 'digital' && (<button type=\"button\" onClick={() => setSaleMode('auction')}")) {
        code = code.replace(
            /<button type="button" onClick=\{\(\) => setSaleMode\('auction'\)\}/g,
            `{(formType as string) !== 'digital' && (<button type="button" onClick={() => setSaleMode('auction')}`
        ).replace(
            /🔨 Open Auction<\/button>/g,
            `🔨 Open Auction</button>)}`
        );
    }

    // 3. Sort Tabs
    const gridTarget = '{/* GRID DISPATCH MATRIX WITH DOOM SCROLL MAPPING */}';
    const sortTabsUI = `{/* INJECTED MASTER SORT TABS */}
              <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-4 w-full">
                <span className="text-[10px] font-black text-slate-500 uppercase flex items-center mr-2">Sort Matrix:</span>
                {[
                  { id: 'newest', label: 'Newest First' }, 
                  { id: 'oldest', label: 'Oldest First' }, 
                  { id: 'price_high', label: 'Price: High to Low' }, 
                  { id: 'price_low', label: 'Price: Low to High' }
                ].map(sort => (
                  <button
                    key={sort.id}
                    onClick={() => setSortOrder(sort.id)}
                    className={\`px-3 py-1.5 text-[10px] font-black uppercase transition-all rounded \${sortOrder === sort.id ? 'bg-cyan-950 text-cyan-400 border border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-black text-slate-400 border border-slate-800 hover:border-cyan-500/50'}\`}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>\n              `;

    if (!code.includes('Sort Matrix:')) {
        code = code.split(gridTarget).join(sortTabsUI + gridTarget);
    }

    // 4. Sort Logic (with strict Number parsing)
    const sortBlockRegex = /\[\.\.\.visiblySlicedListings\]\.sort\([\s\S]*?\.map\(/;
    const safeSortLogic = `[...visiblySlicedListings].sort((a, b) => {
                  const valA = Number(a.highestBid) > 0 ? Number(a.highestBid) : Number(a.reservePrice);
                  const valB = Number(b.highestBid) > 0 ? Number(b.highestBid) : Number(b.reservePrice);
                  if (sortOrder === 'price_high') return valB - valA;
                  if (sortOrder === 'price_low') return valA - valB;
                  if (sortOrder === 'oldest') return Number(a.id || 0) - Number(b.id || 0);
                  return Number(b.id || 0) - Number(a.id || 0); // newest default
                }).map(`;

    if (code.match(sortBlockRegex)) {
        code = code.replace(sortBlockRegex, safeSortLogic);
    }

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ TYPESCRIPT OVERRIDE: Final UI patched.");
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
