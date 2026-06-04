const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Upgrade the State if it exists, or inject it
    if (!code.includes('sortOrder')) {
        code = code.replace(/(const \[[^\]]+\] = useState[^;]+;)/, "$1\n  const [sortOrder, setSortOrder] = useState('newest');");
    }

    // 2. The sleek, clickable Tabs UI
    const newSortUI = `
          {/* INJECTED MASTER SORT TABS */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-4 w-full col-span-full">
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
                      className={\`px-3 py-1.5 text-[10px] font-black uppercase transition-all rounded \${sortOrder === sort.id ? 'bg-emerald-900 text-emerald-400 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-black text-slate-400 border border-slate-800 hover:border-emerald-500/50'}\`}
                  >
                      {sort.label}
                  </button>
              ))}
          </div>\n          `;

    // 3. Clean up the old injected dropdown if it somehow managed to hide in the code
    code = code.replace(/\{\/\* INJECTED SORT UI \*\/\}[\s\S]*?<\/div>/, '');

    // 4. Inject the new Sort Tabs and Advanced Sorting Logic directly into the Array Mapper
    code = code.replace(/([a-zA-Z0-9_]+)\.map\(/g, (match, arrayName) => {
        // Target the most common arrays your custom UI might be using
        if (['marketItems', 'auctions', 'items', 'supabaseRecords', 'activeAuctions', 'bounties', 'displayItems'].includes(arrayName)) {
            return newSortUI + `[...${arrayName}].sort((a, b) => {
              if (sortOrder === 'price_high') return Number(b.price || b.reservePrice || b.highest_bid || 0) - Number(a.price || a.reservePrice || a.highest_bid || 0);
              if (sortOrder === 'price_low') return Number(a.price || a.reservePrice || a.highest_bid || 0) - Number(b.price || b.reservePrice || b.highest_bid || 0);
              if (sortOrder === 'oldest') return Number(a.contract_item_id || a.id || 1) - Number(b.contract_item_id || b.id || -1);
              return Number(b.contract_item_id || b.id || 1) - Number(a.contract_item_id || a.id || -1); // newest default
          }).map(`;
        }
        return match;
    });

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ UI UPGRADED: Master Sort Tabs (Time & Price) Injected Successfully.");
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
