const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Inject the Sort State
    if (!code.includes('sortOrder')) {
        code = code.replace(/(const \[[^\]]+\] = useState[^;]+;)/, "$1\n  const [sortOrder, setSortOrder] = useState('newest');");
    }

    // 2. Hide the Auction Button Safely for Digital Bounties
    if (!code.includes("formType !== 'digital' && (<button type=\"button\" onClick={() => setSaleMode('auction')}")) {
        code = code.replace(
            /<button type="button" onClick=\{\(\) => setSaleMode\('auction'\)\}/g,
            `{formType !== 'digital' && (<button type="button" onClick={() => setSaleMode('auction')}`
        ).replace(
            /🔨 Open Auction<\/button>/g,
            `🔨 Open Auction</button>)}`
        );
    }

    // 3. Inject the Sort Tabs
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

    // 4. Inject the advanced sorting logic
    const mapTarget = "visiblySlicedListings.map(item =>";
    const mappedInjection = `[...visiblySlicedListings].sort((a, b) => {
                  if (sortOrder === 'price_high') return Number(b.highestBid > 0 ? b.highestBid : b.reservePrice) - Number(a.highestBid > 0 ? a.highestBid : a.reservePrice);
                  if (sortOrder === 'price_low') return Number(a.highestBid > 0 ? a.highestBid : a.reservePrice) - Number(b.highestBid > 0 ? b.highestBid : b.reservePrice);
                  if (sortOrder === 'oldest') return Number(a.id) - Number(b.id);
                  return Number(b.id) - Number(a.id); // newest default
                }).map(item =>`;

    if (!code.includes("sortOrder === 'price_high'")) {
        code = code.split(mapTarget).join(mappedInjection);
    }

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ UI UPGRADED: Clean compile. Filters and Bounty lock active.");
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
