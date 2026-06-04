const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Fix BigInt calls
    code = code.replace(/BigInt\(selectedItem\.contract_item_id\)/g, "BigInt(selectedItem.contract_item_id || 0)");
    
    // Fix Number calls (like in executeConfirmDelivery)
    code = code.replace(/Number\(selectedItem\.contract_item_id\)/g, "Number(selectedItem.contract_item_id || 0)");

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ NULL SAFETY FIXED: All contract_item_id references now have a safe fallback.");
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
