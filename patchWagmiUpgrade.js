const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Upgrade Mainnet Address
    code = code.replace(/0x1EB0A260528B1639DD19B5CB61160797A8FB1EFF/g, "0x8714D5f904a9D96db101CE03287Dd161BAD90ac5");

    // 2. Patch wagmi write calls for purchasing (Lines 195 & 198)
    code = code.replace(/functionName:\s*'purchaseItem',\s*args:\s*\[BigInt\(selectedItem\.id\)\]/g, "functionName: selectedItem.saleMode === 'fixed' ? 'buyNow' : 'placeBid', args: selectedItem.saleMode === 'fixed' ? [BigInt(selectedItem.id)] : [BigInt(selectedItem.id), bidWei]");
    
    code = code.replace(/functionName:\s*'purchaseItem',\s*args:\s*\[BigInt\(selectedItem\.id\)\],\s*value:\s*bidWei/g, "functionName: selectedItem.saleMode === 'fixed' ? 'buyNow' : 'placeBid', args: selectedItem.saleMode === 'fixed' ? [BigInt(selectedItem.id)] : [BigInt(selectedItem.id), bidWei], value: bidWei");

    // 3. Patch wagmi read calls for the Ledger Sync
    code = code.replace(/functionName:\s*'auctionCounter'/g, "functionName: 'nextListingId'");
    code = code.replace(/functionName:\s*'auctions'/g, "functionName: 'listings'");

    // 4. Update the ABI (Replaces everything between line 26 and 150)
    const abiStart = code.indexOf('const MARKETPLACE_V5_ABI = [');
    const abiEnd = code.indexOf('const PHYSICAL_CATEGORIES = [');
    
    if (abiStart !== -1 && abiEnd !== -1) {
        const newAbi = `const MARKETPLACE_V5_ABI = [
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"buyNow","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"},{"internalType":"uint256","name":"_bidAmount","type":"uint256"}],"name":"placeBid","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_price","type":"uint256"},{"internalType":"address","name":"_paymentToken","type":"address"},{"internalType":"uint8","name":"_assetType","type":"uint8"},{"internalType":"address","name":"_nftContract","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"uint256","name":"_durationDays","type":"uint256"}],"name":"listAsset","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[],"name":"nextListingId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"listings","outputs":[{"internalType":"address","name":"seller","type":"address"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"address","name":"paymentToken","type":"address"},{"internalType":"uint8","name":"assetType","type":"uint8"},{"internalType":"uint8","name":"status","type":"uint8"},{"internalType":"uint256","name":"auctionEndTime","type":"uint256"},{"internalType":"address","name":"highestBidder","type":"address"},{"internalType":"uint256","name":"highestBid","type":"uint256"},{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bool","name":"fundsReleased","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"markShipped","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"confirmDelivery","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"fileDispute","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"autoReleaseEscrow","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"cancelListing","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"pendingRefunds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];\n\n`;
        code = code.substring(0, abiStart) + newAbi + code.substring(abiEnd);
    }

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ WAGMI UPGRADED: Core Web3 architecture is securely synced to the V5 Mainnet Contract.");
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
