const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Inject the State (Anchors to the very first useState it finds)
    if (!code.includes('sortOrder')) {
        code = code.replace(/(const \[[^\]]+\] = useState[^;]+;)/, "$1\n  const [sortOrder, setSortOrder] = useState('newest');");
    }

    // 2. Inject the Logic (Targets the array mapping function safely)
    code = code.replace(/([a-zA-Z0-9_]+)\.map\(/g, (match, arrayName) => {
        // We target the most common array names you might be using to avoid breaking other UI elements
        if (['marketItems', 'auctions', 'items', 'supabaseRecords', 'activeAuctions'].includes(arrayName)) {
            return `(sortOrder === 'newest' ? [...${arrayName}].reverse() : [...${arrayName}]).map(`;
        }
        return match;
    });

    // 3. Inject the UI Dropdown (Anchors to the Market tab or Main container)
    if (code.includes("activeTab === 'MARKET'") && !code.includes("Sort: Newest First")) {
        code = code.replace(/\{activeTab === 'MARKET' && \(\s*<div[^>]*>/, (match) => {
            return match + `\n          {/* INJECTED SORT UI */}
          <div className="mb-4 flex justify-end col-span-full w-full">
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-black border border-green-800 text-green-500 p-2 text-sm focus:outline-none cursor-pointer shadow-[0_0_10px_rgba(34,197,94,0.2)]">
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>
          </div>\n`;
        });
    } else if (!code.includes("Sort: Newest First")) {
         // Fallback anchor if you are using custom tab logic
         code = code.replace(/(<main[^>]*>)/, `$1\n        {/* INJECTED SORT UI */}
        <div className="mb-4 flex justify-end w-full p-4">
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-black border border-green-800 text-green-500 p-2 text-sm focus:outline-none cursor-pointer shadow-[0_0_10px_rgba(34,197,94,0.2)]">
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
          </select>
        </div>\n`);
    }

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ UI UPGRADED: Dynamic Market Sorting Injected Successfully.");
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
