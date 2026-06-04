const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Regex to capture everything from the start of the sort to the map function
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
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ TYPESCRIPT OVERRIDE: Sort logic strictly typed.");
    } else {
        console.log("⚠️ TARGET EVADED: Could not locate the sort block.");
    }

} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
