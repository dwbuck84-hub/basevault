const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Find the interface line and inject the missing property
    const oldInterfaceLine = 'id: string; type: \'digital\' | \'physical\' | \'tokenized_nft\';';
    const newInterfaceLine = 'id: string; contract_item_id?: number; type: \'digital\' | \'physical\' | \'tokenized_nft\';';

    if (code.includes(oldInterfaceLine)) {
        code = code.replace(oldInterfaceLine, newInterfaceLine);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ INTERFACE SYNCED: 'contract_item_id' added to AuctionListing type definition.");
    } else {
        console.log("❌ SCRIPT FAULT: Could not find the interface definition.");
    }
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
