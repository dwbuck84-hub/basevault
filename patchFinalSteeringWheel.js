const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Inject Claim Refund into Telemetry Dashboard
    const telemetryAnchor = '<h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1.5">Deployments</h4>';
    const refundButton = `
                  <div className="bg-[#090d16] border border-slate-800 rounded-lg p-4 mt-4">
                    <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Refund Vault</h3>
                    <div className="flex gap-2">
                      <button onClick={() => executeClaimRefund(false)} className="bg-amber-950 px-3 py-1.5 text-[9px] font-black text-amber-400 border border-amber-500/30 rounded uppercase">Claim ETH Refund ({pendingEthRefund})</button>
                      <button onClick={() => executeClaimRefund(true)} className="bg-amber-950 px-3 py-1.5 text-[9px] font-black text-amber-400 border border-amber-500/30 rounded uppercase">Claim USDC Refund ({pendingUsdcRefund})</button>
                    </div>
                  </div>`;
    
    if (code.includes(telemetryAnchor)) {
        code = code.replace(telemetryAnchor, telemetryAnchor + refundButton);
    }

    // 2. Inject Lifecycle buttons into Fulfillment View
    const fulfillAnchor = '<button onClick={handleSaveTracking} className="mt-2 bg-emerald-950 px-3 py-1 text-[9px] font-black text-emerald-400 border border-emerald-500/30 rounded uppercase">Transmit Manifest</button>';
    const lifecycleButtons = `
                    <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
                      <button onClick={() => executeConfirmDelivery(selectedItem.id)} className="bg-emerald-950 px-3 py-1 text-[9px] font-black text-emerald-400 border border-emerald-500/30 rounded uppercase">Confirm Delivery</button>
                      <button onClick={() => executeFileDispute(selectedItem.id)} className="bg-rose-950 px-3 py-1 text-[9px] font-black text-rose-400 border border-rose-500/30 rounded uppercase">File Dispute</button>
                      <button onClick={() => executeCancelListing(selectedItem.id, selectedItem.paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase())} className="bg-slate-900 px-3 py-1 text-[9px] font-black text-slate-400 border border-slate-600 rounded uppercase">Cancel Listing</button>
                    </div>`;

    if (code.includes(fulfillAnchor)) {
        code = code.replace(fulfillAnchor, fulfillAnchor + lifecycleButtons);
    }

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ STEERING WHEEL WIRED: All final action buttons are now live.");
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
