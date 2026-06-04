const fs = require('fs');
try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // The marker is the end of the checkout div (line 1032 in your file)
    const targetBlock = /<\/div>\n\s*\{\/\* DYNAMIC AUCTION\/BUY NOW CHECKOUT BAR \*\/\}/g;
    
    // We want to inject our button right AFTER the checkout bar
    const injection = `
                  {/* ESCROW SETTLEMENT INTERFACE */}
                  {selectedItem.status === 'pending' && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      {selectedItem.buyer?.toLowerCase() === address?.toLowerCase() ? (
                        <button 
                          onClick={async () => {
                            try {
                              await supabase.from(DB_TABLE).update({ 
                                status: 'sold', 
                                settled_at: new Date().toISOString() 
                              }).eq('id', selectedItem.id);
                              alert("✅ SETTLEMENT VERIFIED. Trophy mode active.");
                              setSelectedItem(null);
                              if (typeof syncV5Ledger === 'function') syncV5Ledger();
                            } catch (err: any) { alert("❌ ERROR: " + err.message); }
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold py-3 rounded shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse uppercase tracking-wider text-xs"
                        >
                          CONFIRM RECEIPT & SETTLE
                        </button>
                      ) : (
                        <div className="w-full bg-black/60 text-yellow-500/70 font-bold py-3 rounded border border-yellow-500/20 text-center text-xs uppercase tracking-widest">
                          Item Locked in Escrow
                        </div>
                      )}
                    </div>
                  )}
                  {/* ============================= */}`;

    if (code.includes('DYNAMIC AUCTION/BUY NOW CHECKOUT BAR')) {
        code = code.replace(targetBlock, `</div>` + injection);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ SETTLEMENT WIRING COMPLETE: Buyer interface is now live.");
    } else {
        console.log("⚠️ Marker not found. The checkout structure might have changed.");
    }
} catch(e) { console.error("❌ SCRIPT FAULT:", e.message); }
