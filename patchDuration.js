const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Hunt for the exact React input tied to formDuration
    const durationInputRegex = /<input[^>]*value=\{formDuration\}[^>]*\/>/g;
    
    const newDropdown = `<select 
                  value={formDuration} 
                  onChange={(e) => setFormDuration(e.target.value)} 
                  className="w-full bg-black border border-green-800 text-green-500 p-3 focus:outline-none focus:border-green-400 cursor-pointer"
                >
                  <option value="86400">1 Day (Rapid)</option>
                  <option value="259200">3 Days (Standard)</option>
                  <option value="604800">7 Days (Extended)</option>
                  <option value="1209600">14 Days (Long)</option>
                  <option value="2592000">30 Days (Maximum)</option>
                </select>`;
                
    if (code.match(durationInputRegex)) {
        code = code.replace(durationInputRegex, newDropdown);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ UI UPGRADED: Duration Dropdown (Seconds Protocol) Injected.");
    } else {
        console.log("⚠️ TARGET EVADED: Could not find the exact <input> element. We may need to manually swap it.");
    }

} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
