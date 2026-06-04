const fs = require('fs');
try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Inject the Escrow Badges over the image
    const oldImageBlock = /<div className="relative bg-\[#090d16\] aspect-video flex items-center justify-center border-b border-slate-800 overflow-hidden">[\s\S]*?<span className="absolute top-2 right-2[\s\S]*?<\/span>\n\s*<\/div>/g;

    const newImageBlock = `
                    <div className="relative bg-[#090d16] aspect-video flex items-center justify-center border-b border-slate-800 overflow-hidden group">
                      {item.images.length > 0 ? (
                        <img src={item.images[0]} className={\`w-full h-full object-cover transition-all duration-500 \${item.status !== 'active' ? 'opacity-30 grayscale' : 'group-hover:scale-105 opacity-90'}\`} />
                      ) : (
                        <div className="text-cyan-500/30 text-5xl font-black w-full h-full flex items-center justify-center bg-cyan-950/20">{'< / >'}</div>
                      )}
                      
                      {/* Standard Badge */}
                      {item.status === 'active' && (
                        <span className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded border border-slate-700 text-[9px] font-black text-amber-400 tracking-wider flex items-center gap-1 z-10">
                          {item.saleMode === 'fixed' ? '🛒 BUY NOW' : '🔨 AUCTION'}
                        </span>
                      )}

                      {/* Escrow Pending Badge */}
                      {item.status === 'pending' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 pointer-events-none">
                          <div className="border-2 border-yellow-500 text-yellow-500 px-4 py-2 rounded font-mono font-bold tracking-widest bg-black/80 transform -rotate-12 shadow-[0_0_15px_rgba(234,179,8,0.5)] whitespace-nowrap text-xs md:text-sm">
                            ESCROW LOCKED
                          </div>
                        </div>
                      )}

                      {/* Fading Trophy Badge */}
                      {item.status === 'sold' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-10 pointer-events-none">
                          <div className="border-2 border-red-500 text-red-500 px-6 py-2 rounded font-mono font-extrabold tracking-widest text-lg bg-black/90 transform -rotate-12 shadow-[0_0_25px_rgba(239,68,68,0.7)] whitespace-nowrap">
                            SETTLED
                          </div>
                        </div>
                      )}
                    </div>`;

    code = code.replace(oldImageBlock, newImageBlock.trim());

    // 2. We need to find the bottom of the card to inject the new button logic.
    // However, looking at your grep output, the 'Buy' button logic is actually triggered
    // when you click on an item to open the MODAL (setSelectedItem), not on the grid card itself. 
    // This is actually better UX. The grid displays the status, the modal handles the settlement.

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ GRID UPGRADED: Matrix overlays injected into asset cards.");

} catch(e) { console.error("❌ SCRIPT FAULT:", e.message); }
