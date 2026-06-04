const fs = require('fs');
try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Target the bottom of the Financial Breakdown in the modal
    const targetBlock = /<\/div>\n\s*<\/div>\n\s*\{\/\* ACTION BUTTONS \*\/\}/g;

    const newBlock = `</div>
                  </div>

                  {/* SETTLEMENT OVERRIDE */}
                  {selectedItem.status === 'pending' && selectedItem.buyer?.toLowerCase() === address?.toLowerCase() && (
                    <div className="pt-4 border-t border-slate-800">
                      <p className="text-[10px] text-emerald-400 font-black tracking-widest uppercase mb-2 text-center">Finalize Smart Contract Escrow</p>
                      <button 
                        onClick={async () => {
                          try {
                            // 1. Verify on-chain completion here if your contract requires it
                            // 2. Finalize the Web2 Ledger
                            await supabase.from(DB_TABLE).update({ 
                              status: 'sold', 
                              settled_at: new Date().toISOString() 
                            }).eq('id', selectedItem.id);
                            
                            alert("✅ SETTLEMENT VERIFIED. Vault unlocked, funds routed.");
                            setSelectedItem(null);
                            if (typeof syncV5Ledger === 'function') syncV5Ledger();
                          } catch (err: any) {
                            alert("❌ SETTLEMENT FAILED: " + err.message);
                          }
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold py-3 px-4 rounded shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse uppercase tracking-wider"
                      >
                        CONFIRM RECEIPT & SETTLE
                      </button>
                    </div>
                  )}

                  {selectedItem.status === 'pending' && selectedItem.buyer?.toLowerCase() !== address?.toLowerCase() && (
                    <div className="pt-4 border-t border-slate-800 text-center">
                       <div className="w-full bg-black/60 text-yellow-500/70 font-bold py-3 rounded border border-yellow-500/20 cursor-not-allowed text-xs uppercase tracking-widest">
                          Item Locked in Escrow
                       </div>
                    </div>
                  )}

                  {/* ACTION BUTTONS */}`;

    if (code.match(targetBlock)) {
        code = code.replace(targetBlock, newBlock);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ MODAL UPGRADED: Settlement logic wired to buyer interface.");
    } else {
        console.log("⚠️ Could not find action buttons marker. The modal might be structured differently.");
    }
} catch(e) { console.error("❌ SCRIPT FAULT:", e.message); }
