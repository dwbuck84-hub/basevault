const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Inject the State and Oracle Fetcher (Anchoring to the first useState)
    if (!code.includes('ethPriceUsd')) {
        code = code.replace(/(const \[[^\]]+\] = useState[^;]+;)/, "$1\n  const [ethPriceUsd, setEthPriceUsd] = useState<number | null>(null);\n\n  useEffect(() => {\n    const fetchEthPrice = async () => {\n      try {\n        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');\n        const data = await res.json();\n        setEthPriceUsd(data.ethereum.usd);\n      } catch (e) { console.error(\"Matrix Price Feed Offline\"); }\n    };\n    fetchEthPrice();\n  }, []);");
    }

    // 2. Ensure useEffect is imported if it isn't already
    if (!code.includes('useEffect(') && !code.includes('useEffect,')) {
        code = code.replace(/import \{ useState \}/, 'import { useState, useEffect }');
    }

    // 3. Inject the Live USD conversion into the Price Label (Looks for any label containing "Price" and "ETH")
    code = code.replace(/(<label[^>]*>[\s\S]*?Price[\s\S]*?\(ETH\)[\s\S]*?)(<\/label>)/gi, (match, p1, p2) => {
        if (match.includes('ethPriceUsd')) return match; // Skip if already patched
        return p1 + `\n                  {ethPriceUsd && price && !isNaN(Number(price)) && (
                    <span className="text-cyan-400 ml-2 font-bold tracking-widest drop-shadow-[0_0_5px_rgba(34,211,153,0.8)] text-xs">
                      (≈ \${(Number(price) * ethPriceUsd).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD)
                    </span>
                  )}` + p2;
    });

    // 4. Destroy the free-text input for Duration and replace with the Dropdown
    const durationInputRegex = /<input[^>]*value=\{durationDays\}[^>]*onChange=\{[^}]*setDurationDays[^}]*\}[^>]*\/>/g;
    const newDropdown = `<select 
                  value={durationDays} 
                  onChange={(e) => setDurationDays(e.target.value)} 
                  className="w-full bg-black border border-green-800 text-green-500 p-3 focus:outline-none focus:border-green-400 cursor-pointer"
                >
                  <option value="1">1 Day (Rapid)</option>
                  <option value="3">3 Days (Standard)</option>
                  <option value="7">7 Days (Extended)</option>
                  <option value="14">14 Days (Long)</option>
                </select>`;
    code = code.replace(durationInputRegex, newDropdown);

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ UI UPGRADED: Auction Dropdown & Real-Time Oracle Feed Injected Successfully.");
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
