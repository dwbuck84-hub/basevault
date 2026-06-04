const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    const abiBlock = `
  // 🔥 V5 CONTRACT ABI 🔥
  const MARKET_ABI = [
    "function listAsset(uint256 _price, address _paymentToken, uint8 _assetType, address _nftContract, uint256 _tokenId, uint256 _durationDays) external payable",
    "function placeBid(uint256 _id, uint256 _bidAmount) external payable",
    "function buyNow(uint256 _id) external payable",
    "function markShipped(uint256 _id) external",
    "function confirmDelivery(uint256 _id) external",
    "function fileDispute(uint256 _id) external",
    "function autoReleaseEscrow(uint256 _id) external",
    "function approveBounty(uint256 _id) external",
    "function cancelListing(uint256 _id) external payable"
  ];`;

    // 1. Wipe any previously injected/misplaced ABI blocks
    code = code.replace(/\/\/ 🔥 V5 CONTRACT ABI 🔥[\s\S]*?\];/g, "");
    
    // 2. Inject it exactly where the compiler needs it
    const anchor = "const connectWallet = async () => {";
    if (code.includes(anchor)) {
        code = code.replace(anchor, abiBlock + "\n\n  " + anchor);
        console.log("✅ ABI FIXED: Perfectly injected into scope.");
    } else {
        console.log("⚠️ TARGET EVADED: Could not find connectWallet.");
    }

    fs.writeFileSync('app/page.tsx', code, 'utf8');
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
