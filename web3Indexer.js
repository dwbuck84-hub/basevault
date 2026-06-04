const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Target the entire broken RPC loop and the setListings call
    const regex = /let counter = BigInt\(0\);[\s\S]*?setListings\(activeListings[^\n]*\);/g;

    const replacement = `
    // === WEB3 INDEXER OVERRIDE ===
    if (dbData && dbData.length > 0) {
        const mapped = dbData.map(dbItem => ({
            id: dbItem.id || String(Math.random()),
            title: dbItem.title || "Matrix Asset",
            description: dbItem.description || "",
            category: dbItem.category || "digital",
            images: dbItem.images && dbItem.images.length > 0 ? dbItem.images : [],
            seller: dbItem.seller || "0x0000000000000000000000000000000000000000",
            highestBidder: "0x0000000000000000000000000000000000000000",
            reservePrice: dbItem.reservePrice || "0",
            highestBid: "0",
            endTime: 0,
            paymentToken: dbItem.paymentToken || "0x0000000000000000000000000000000000000000",
            settled: false,
            shippingAddress: dbItem.shipping_address || "",
            trackingInfo: dbItem.tracking_info || "",
            shippingLabelUrl: dbItem.shipping_label_url || "",
            sellerRating: dbItem.seller_rating || 0,
            buyerRating: dbItem.buyer_rating || 0,
            selectedShippingOption: dbItem.selected_shipping_option || "USPS",
            premiumShipping: dbItem.premium_shipping || false,
            saleMode: dbItem.sale_mode || "fixed",
            type: dbItem.type || "digital"
        }));
        setListings(mapped);
        console.log("✅ WEB3 INDEXER: Grid fully rendered from Supabase Vault. RPC rate limits bypassed.");
    } else {
        setListings([]);
        console.log("⚠️ INDEXER: Vault is empty.");
    }
    // =============================
    `;

    if (code.match(regex)) {
        code = code.replace(regex, replacement);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ ARCHITECTURE UPGRADED: Frontend now uses pure DB indexing.");
    } else {
        console.log("⚠️ Target not found. The loop may have already been modified.");
    }
} catch(e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
