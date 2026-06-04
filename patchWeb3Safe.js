const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Safely inject ethers at the top
    if (!code.includes("import { ethers }")) {
        code = code.replace(/("use client";?|'use client';?)/, "$1\nimport { ethers } from 'ethers';");
    }

    // 2. The exact block we want to replace (from your master commit)
    const oldBlock = `  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const c = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      setContract(c);
      setAccount(await signer.getAddress());
    }
  };`;

    // 3. The fully upgraded Mainnet Web3 Block
    const newBlock = `  // 🔥 BASE MAINNET V5 CONTRACT 🔥
  const MARKET_CONTRACT_ADDRESS = "0x8714D5f904a9D96db101CE03287Dd161BAD90ac5";

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
  ];

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const c = new ethers.Contract(MARKET_CONTRACT_ADDRESS, MARKET_ABI, signer);
      setContract(c as any);
      setAccount((await signer.getAddress()) as any);
    }
  };`;

    // Swap the blocks safely
    if (code.includes('const connectWallet = async () => {') && !code.includes('MARKET_CONTRACT_ADDRESS')) {
        if (code.includes(oldBlock)) {
             code = code.replace(oldBlock, newBlock);
        } else {
             // Failsafe: Inject variables above function if exact match fails
             code = code.replace('const connectWallet = async () => {', newBlock.split('const connectWallet')[0] + '\n  const connectWallet = async () => {');
        }
    }

    // 4. Safely fix the string slice issue on the UI without touching Tailwind
    if (code.includes('account.slice(')) {
        code = code.replace(/account\.slice\(/g, 'String(account).slice(');
    }

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ WEB3 SAFELY INJECTED: The UI was not touched.");
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
