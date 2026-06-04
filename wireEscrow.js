const fs = require('fs');
try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Target the exact successful Web3 block where we handle shipping
    const targetBlock = /if \(selectedItem\.type === 'physical'\) \{\s*await supabase\.from\(DB_TABLE\)\.update\(\{ selected_shipping_option: chosenShippingTier \}\)\.eq\('id', selectedItem\.id\);\s*\}/g;

    const escrowInjection = `
      if (selectedItem.type === 'physical') {
        await supabase.from(DB_TABLE).update({ selected_shipping_option: chosenShippingTier }).eq('id', selectedItem.id);
      }
      
      // === WEB2 ESCROW LOCK ===
      await supabase.from(DB_TABLE).update({
          status: 'pending',
          buyer: address,
          final_price: selectedItem.reservePrice
      }).eq('id', selectedItem.id);
      // ========================
    `;

    if(code.match(targetBlock)) {
        code = code.replace(targetBlock, escrowInjection);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ PIPELINE FUSED: 'Buy' button now locks the database escrow.");
    } else {
        console.log("⚠️ Target block not found. Cannot inject escrow logic.");
    }
} catch(e) { console.error("❌ SCRIPT FAULT:", e.message); }
