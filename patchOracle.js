const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Safely inject the Base Mainnet import if it's missing
    if (!code.includes("import { base }")) {
        code = code.replace(/("use client";?|'use client';?)/, "$1\nimport { base } from 'viem/chains';");
    }

    // 2. Fix the Network Mismatch (Sepolia to Mainnet)
    if (code.includes('baseSepolia')) {
        code = code.replace(/baseSepolia/g, 'base');
        console.log("✅ LEDGER SYNC FIXED: UI matrix is now reading from Base Mainnet.");
    }

    // 3. Upgrade the NFT Verification Oracle
    const targetLine = 'const verifyNftOwnership = () => { setIsVerifyingNft(true); setTimeout(() => { setIsNftVerified(true); setIsVerifyingNft(false); alert("✅ CRYPTOGRAPHIC VERIFICATION COMPLETE."); }, 1000); };';
    
    const newOracle = `const verifyNftOwnership = async () => {
    setIsVerifyingNft(true);
    try {
      if (!nftContractAddress || !nftTokenId || !address) {
        alert("⚠️ MISSING DATA: Contract Address, Token ID, and Vault Key required.");
        setIsVerifyingNft(false);
        return;
      }
      const publicClient = createPublicClient({ chain: base, transport: http() });
      const owner = await publicClient.readContract({
        address: nftContractAddress as \`0x\${string}\`,
        abi: ERC721_ABI,
        functionName: 'ownerOf',
        args: [BigInt(nftTokenId)]
      }) as string;
      
      if (owner.toLowerCase() === address.toLowerCase()) {
        setIsNftVerified(true);
        alert("✅ CRYPTOGRAPHIC VERIFICATION COMPLETE: On-chain ownership confirmed.");
      } else {
        setIsNftVerified(false);
        alert("❌ VERIFICATION FAILED: Your vault key does not hold this asset.");
      }
    } catch(e: any) {
      setIsNftVerified(false);
      alert("❌ ORACLE ERROR: " + (e.reason || e.shortMessage || "Invalid contract or token ID."));
    }
    setIsVerifyingNft(false);
  };`;

    if (code.includes(targetLine)) {
        code = code.replace(targetLine, newOracle);
        console.log("✅ STRIKE 8 COMPLETED: Fake NFT timer replaced with real Mainnet Oracle.");
    } else {
        // Fallback X-ray split
        const fallbackIdx = code.indexOf('const verifyNftOwnership');
        const endIdx = code.indexOf('const [activeTab', fallbackIdx);
        if (fallbackIdx !== -1 && endIdx !== -1) {
            code = code.substring(0, fallbackIdx) + newOracle + '\n  ' + code.substring(endIdx);
            console.log("✅ STRIKE 8 COMPLETED: Real Mainnet Oracle injected via fallback.");
        } else {
            console.log("❌ SCRIPT FAULT: Could not find NFT Oracle anchor.");
        }
    }

    fs.writeFileSync('app/page.tsx', code, 'utf8');
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
