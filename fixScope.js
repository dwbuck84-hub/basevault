const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Target the override block we just injected
    const replaceRegex = /\/\/ === WEB3 INDEXER OVERRIDE ===[\s\S]*?\/\/ =============================/g;

    const fixedBlock = `
    // === WEB3 INDEXER OVERRIDE ===
    try {
        const { data: matrixData, error: matrixError } = await supabase.from(DB_TABLE).select('*').limit(1000);
        if (matrixError) console.error("❌ SUPABASE INDEXER ERROR:", matrixError.message);

        if (matrixData && matrixData.length > 0) {
            const mapped = matrixData.map((dbItem: any) => ({
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
            console.log("✅ WEB3 INDEXER: Grid fully rendered from Supabase Vault.");
        } else {
            setListings([]);
            console.log("⚠️ INDEXER: Vault is empty.");
        }
    } catch(indexerErr: any) {
        console.error("❌ INDEXER CRASH:", indexerErr.message);
    }
    // =============================
    `;

    if (code.match(replaceRegex)) {
        code = code.replace(replaceRegex, fixedBlock);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ SCOPE REPAIRED: Database fetch successfully integrated into the Indexer.");
    } else {
        console.log("⚠️ Target not found. The override block might be missing.");
    }
} catch(e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
