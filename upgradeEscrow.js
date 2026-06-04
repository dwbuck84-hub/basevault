const fs = require('fs');
try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Target the Web3 Indexer block
    const searchBlock = /if \(matrixData && matrixData\.length > 0\) \{[\s\S]*?console\.log\("✅ WEB3 INDEXER: Grid fully rendered from Supabase Vault\."\);\n\s*\}/g;

    const newBlock = `
        if (matrixData && matrixData.length > 0) {
            // Fading Trophy Logic: Set the 14-Day Cutoff
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

            const mapped = matrixData
                .filter((dbItem: any) => {
                    // Drop sold items older than 14 days
                    if (dbItem.status === 'sold' && dbItem.settled_at) {
                        return new Date(dbItem.settled_at) > twoWeeksAgo;
                    }
                    return true;
                })
                .map((dbItem: any) => ({
                    id: dbItem.id || String(Math.random()),
                    title: dbItem.title || "Matrix Asset",
                    description: dbItem.description || "",
                    category: dbItem.category || "digital",
                    images: Array.isArray(dbItem.images) ? dbItem.images : (typeof dbItem.images === 'string' ? (dbItem.images.startsWith('[') ? JSON.parse(dbItem.images) : [dbItem.images]) : ["https://placehold.co/600x400/131b30/10b981?text=ASSET+SECURED"]),
                    seller: dbItem.seller || "0x0000000000000000000000000000000000000000",
                    highestBidder: dbItem.buyer || "0x0000000000000000000000000000000000000000",
                    reservePrice: dbItem.reservePrice || "0",
                    highestBid: dbItem.final_price || "0",
                    endTime: 0,
                    paymentToken: dbItem.paymentToken || "0x0000000000000000000000000000000000000000",
                    settled: dbItem.status === 'sold',
                    status: dbItem.status || 'active',
                    buyer: dbItem.buyer || null,
                    finalPrice: dbItem.final_price || null,
                    purchaseTx: dbItem.purchase_tx || null,
                    settledAt: dbItem.settled_at || null,
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
            console.log("✅ WEB3 INDEXER: Escrow logic engaged. Fading Trophy clock active.");
        }
    `;

    if (code.match(searchBlock)) {
        code = code.replace(searchBlock, newBlock.trim());
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ ESCROW SYNCED: Database columns wired to the UI.");
    } else {
        console.log("⚠️ Could not find target block. It may have already been modified.");
    }
} catch(e) { console.error("❌ SCRIPT FAULT:", e.message); }
