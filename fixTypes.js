const fs = require('fs');
try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Add status, buyer, finalPrice, purchaseTx, and settledAt to the interface
    const interfaceTarget = /interface AuctionListing \{[\s\S]*?\}/;
    const newInterface = `interface AuctionListing {
  id: string; type: 'digital' | 'physical' | 'tokenized_nft'; title: string; category: string; description: string; images: string[]; seller: string; highestBidder: string; reservePrice: string; highestBid: string; endTime: number; paymentToken: string; settled: boolean; nftContract?: string; nftTokenId?: string; shippingAddress?: string; trackingInfo?: string; shippingLabelUrl?: string; sellerRating?: number; buyerRating?: number; selectedShippingOption?: string; premiumShipping?: boolean; saleMode?: 'auction' | 'fixed';
  status?: string; buyer?: string; finalPrice?: string; purchaseTx?: string; settledAt?: string;
}`;

    if (code.match(interfaceTarget)) {
        code = code.replace(interfaceTarget, newInterface);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ TYPES DEFINED: Escrow fields successfully added to interface.");
    } else {
        console.log("⚠️ Could not find interface definition.");
    }
} catch(e) { console.error("❌ SCRIPT FAULT:", e.message); }
