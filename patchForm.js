const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Inject the Oracle State & Fetcher
    const stateTarget = "const [formDuration, setFormDuration] = useState('86400');";
    const stateInjection = `const [formDuration, setFormDuration] = useState('86400');
  const [ethPriceUsd, setEthPriceUsd] = useState<number | null>(null);

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await res.json();
        setEthPriceUsd(data.ethereum.usd);
      } catch (e) { console.error("Matrix Price Feed Offline"); }
    };
    fetchEthPrice();
  }, []);`;
    
    if (!code.includes('ethPriceUsd')) {
        code = code.split(stateTarget).join(stateInjection);
    }

    // 2. Inject the Oracle USD conversion into the Price Label
    const labelTarget = ">{saleMode === 'fixed' ? 'Fixed List Price' : 'Starting Reserve Value'}</label>";
    const labelInjection = `>{saleMode === 'fixed' ? 'Fixed List Price' : 'Starting Reserve Value'}{ethPriceUsd && selectedCurrency === 'ETH' && formReservePrice && !isNaN(Number(formReservePrice)) && (<span className="text-cyan-400 ml-1 font-bold tracking-widest drop-shadow-[0_0_5px_rgba(34,211,153,0.8)] text-[10px]">(≈ $ { (Number(formReservePrice) * ethPriceUsd).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) } USD)</span>)}</label>`;
    
    if (!code.includes('ethPriceUsd && selectedCurrency')) {
        code = code.split(labelTarget).join(labelInjection);
    }

    // 3. Inject the Duration Dropdown right above the FILE UPLOAD comment
    const uploadTarget = "{/* FILE UPLOAD";
    const dropdownInjection = `{saleMode === 'auction' && (
              <div className="mt-1 mb-4">
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
        code = code.split(uploadTarget).join(dropdownInjection);
    }

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ UI UPGRADED: Form layout patched with Oracle Feed and Auction Duration Dropdown.");
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
