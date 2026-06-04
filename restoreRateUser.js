const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    const targetAnchor = 'const { writeContractAsync } = useWriteContract();';
    
    const restoredLogic = `
  // V5.2 Restored Reputation Engine
  const handleRateUser = async (stars: number, role: 'seller' | 'buyer') => { 
    if(selectedItem) { 
      await supabase.from(DB_TABLE).update(role === 'seller' ? { seller_rating: stars } : { buyer_rating: stars }).eq('id', selectedItem.id); 
      alert("✅ MATRIX RANKED."); 
      if (typeof syncV5Ledger === 'function') syncV5Ledger();
      setSelectedItem(null); 
    } 
  };`;

    if (!code.includes('const handleRateUser =')) {
        code = code.replace(targetAnchor, targetAnchor + '\n' + restoredLogic);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ REPUTATION PROTOCOL RESTORED: 'handleRateUser' is back online.");
    } else {
        console.log("ℹ️ Engine already present in file.");
    }
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
