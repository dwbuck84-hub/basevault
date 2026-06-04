const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    const target = "{/* FILE UPLOAD";
    const dropdownInjection = `{saleMode === 'auction' && (
                  <div className="mt-4 mb-2 w-full col-span-full">
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Auction Duration (Time on Market)</label>
                    <select value={formDuration} onChange={(e) => setFormDuration(e.target.value)} className="w-full p-2.5 bg-[#090d16] border border-slate-800 rounded text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer">
                      <option value="86400">1 Day (Rapid)</option>
                      <option value="259200">3 Days (Standard)</option>
                      <option value="604800">7 Days (Extended)</option>
                      <option value="1209600">14 Days (Long)</option>
                      <option value="2592000">30 Days (Maximum)</option>
                    </select>
                  </div>
                )}
                {/* FILE UPLOAD`;
    
    if (!code.includes('Auction Duration (Time on Market)')) {
        code = code.split(target).join(dropdownInjection);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ UI UPGRADED: Duration Dropdown (Seconds) successfully injected.");
    } else {
        console.log("⚠️ TARGET EVADED: Dropdown already exists in the file.");
    }

} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
