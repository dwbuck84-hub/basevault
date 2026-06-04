const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Surgically fix the three onClick calls in the Fulfillment view
    // We wrap selectedItem.id in Number() to satisfy the type checker
    code = code.replace(
        /executeConfirmDelivery\(selectedItem\.id\)/g, 
        "executeConfirmDelivery(Number(selectedItem.id))"
    );
    code = code.replace(
        /executeFileDispute\(selectedItem\.id\)/g, 
        "executeFileDispute(Number(selectedItem.id))"
    );
    code = code.replace(
        /executeCancelListing\(selectedItem\.id/g, 
        "executeCancelListing(Number(selectedItem.id)"
    );

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ TYPE SAFETY FIXED: ID parameters explicitly cast to numbers.");
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
