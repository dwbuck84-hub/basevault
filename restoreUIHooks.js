const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');
    const targetAnchor = 'const { writeContractAsync } = useWriteContract();';
    let restoredCount = 0;
    const missingLogic = [];

    // Check and restore Chat Protocol
    if (!code.includes('const handleClientMessageSubmit =')) {
        missingLogic.push(`  const handleClientMessageSubmit = (e: React.FormEvent) => { e.preventDefault(); if(chatInput.trim() && address) { setBountyMessages(p => [...p, { sender: address, text: chatInput, timestamp: Date.now() }]); setChatInput(''); } };`);
        restoredCount++;
    }
    
    // Check and restore Sandbox Protocol
    if (!code.includes('const executeSandboxCode =')) {
        missingLogic.push(`  const executeSandboxCode = () => { setSandboxLogs(['// PROCESSING LOGISTICS COMPILATION...']); setRunSandboxTrig(prev => prev + 1); };`);
        restoredCount++;
    }
    
    // Check and restore Shipping Integrations
    if (!code.includes('const handleSaveAddress =')) {
        missingLogic.push(`  const handleSaveAddress = async () => { if(selectedItem) { await supabase.from(DB_TABLE).update({ shipping_address: fulfillmentAddress }).eq('id', selectedItem.id); alert("✅ SECURE DESTINATION ROUTED."); if (typeof syncV5Ledger === 'function') syncV5Ledger(); } };`);
        restoredCount++;
    }
    if (!code.includes('const handleSaveTracking =')) {
        missingLogic.push(`  const handleSaveTracking = async () => { if(selectedItem && shippingLabelUrl) { await supabase.from(DB_TABLE).update({ tracking_info: fulfillmentTracking, shipping_label_url: shippingLabelUrl }).eq('id', selectedItem.id); alert("✅ TRANSIT BROADCAST LIVE."); if (typeof syncV5Ledger === 'function') syncV5Ledger(); } };`);
        restoredCount++;
    }

    if (missingLogic.length > 0) {
        code = code.replace(targetAnchor, targetAnchor + '\n  // Restored UI Helper Hooks\n' + missingLogic.join('\n'));
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log(`✅ MASS UI RESTORE COMPLETE: ${restoredCount} offline functions rebooted.`);
    } else {
        console.log("ℹ️ All UI functions already present.");
    }
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
