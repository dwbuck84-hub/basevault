const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Unique Time Engine Injection (With explicit : any type)
    const anchor = "const [mounted, setMounted] = useState(false);";
    const timeEngine = `const [mounted, setMounted] = useState(false);

  // LIVE AUCTION TIMER ENGINE
  const [auctionTick, setAuctionTick] = useState(Math.floor(Date.now() / 1000));
  
  useEffect(() => {
    const timer = setInterval(() => setAuctionTick(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeLeft = (endTime: any) => {
    if (!endTime) return '';
    const diff = Number(endTime) - auctionTick;
    if (diff <= 0) return 'CLOSED';
    const d = Math.floor(diff / 86400);
    const h = Math.floor((diff % 86400) / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return \`\${d > 0 ? d + 'd ' : ''}\${h}h \${m}m \${s}s\`;
  };`;

    if (code.includes(anchor) && !code.includes('formatTimeLeft')) {
        code = code.replace(anchor, timeEngine);
    } else if (!code.includes('formatTimeLeft')) {
        code = code.replace(/(const \[[^\]]+\] = useState[^;]+;)/, `$1\n${timeEngine.replace("const [mounted, setMounted] = useState(false);\n", "")}`);
    }

    // 2. Swap the static 'AUCTION' badge
    const badgeTarget = "{item.saleMode === 'fixed' ? '🛒 BUY NOW' : '🔨 AUCTION'}";
    const badgeInjection = "{item.saleMode === 'fixed' ? '🛒 BUY NOW' : ((item as any).auction_end_time ? (Number((item as any).auction_end_time) > auctionTick ? `⏳ ${formatTimeLeft((item as any).auction_end_time)}` : '🛑 CLOSED') : '🔨 AUCTION')}";
    
    if (code.includes(badgeTarget)) {
        code = code.replace(badgeTarget, badgeInjection);
    }

    // 3. Inject the Seller Rating
    const categoryTarget = "<span className=\"truncate pr-2\">{item.type === 'digital' ? `💼 ${item.category}` : `📦 ${item.category}`}</span>";
    const categoryInjection = `<span className="truncate pr-2">{item.type === 'digital' ? \`💼 \${item.category}\` : \`📦 \${item.category}\`}</span>
                          <span className="text-amber-400 flex-shrink-0 text-[10px] font-black">⭐ {(item as any).seller_rating ? Number((item as any).seller_rating).toFixed(1) : 'NEW'}</span>`;
    
    if (code.includes(categoryTarget) && !code.includes('seller_rating')) {
        code = code.replace(categoryTarget, categoryInjection);
    }

    // 4. Inject the Buyer Rating
    const checkoutTarget = "{selectedItem.saleMode !== 'fixed' && (";
    const checkoutInjection = `{selectedItem.saleMode === 'auction' && Number(selectedItem.highestBid) > 0 && (
                          <div className="w-full text-[10px] text-amber-400 font-black mb-2 text-right tracking-wider">
                            TOP BIDDER REPUTATION: ⭐ {(selectedItem as any).buyer_rating ? Number((selectedItem as any).buyer_rating).toFixed(1) : 'NEW'}
                          </div>
                        )}
                        {selectedItem.saleMode !== 'fixed' && (`;
    
    if (code.includes(checkoutTarget) && !code.includes('TOP BIDDER REPUTATION')) {
        code = code.replace(checkoutTarget, checkoutInjection);
    }

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ UI UPGRADED: Strict TypeScript bypass engaged.");
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
