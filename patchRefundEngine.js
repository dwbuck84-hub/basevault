const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Upgrade the ABI to include claimRefund
    if (!code.includes('"name":"claimRefund"')) {
        const abiInjection = `{"inputs":[{"internalType":"address","name":"_token","type":"address"}],"name":"claimRefund","outputs":[],"stateMutability":"nonpayable","type":"function"},\n  {"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"pendingRefunds"`;
        code = code.replace(/\{"inputs":\[\{"internalType":"address","name":"","type":"address"\},\{"internalType":"address","name":"","type":"address"\}\],"name":"pendingRefunds"/, abiInjection);
    }

    // 2. Inject the Refund Logic
    const refundLogic = `
  // 🔥 STRIKE 10: THE REFUND VAULT 🔥
  const executeClaimRefund = async (isUSDC: boolean) => {
    try {
      const tokenAddress = isUSDC ? USDC_ADDRESS : ETH_ADDRESS;
      await writeContractAsync({ 
        address: VAULT_V5_ADDRESS as \`0x\${string}\`, 
        abi: MARKETPLACE_V5_ABI, 
        functionName: 'claimRefund', 
        args: [tokenAddress] 
      });
      alert("✅ FUNDS SECURED: Refund successfully pulled to your wallet.");
      if (typeof syncV5Ledger === 'function') syncV5Ledger();
    } catch (e: any) { 
      alert("❌ Claim Error: " + (e.reason || e.message)); 
    }
  };
`;

    if (!code.includes('executeClaimRefund')) {
        const anchor = 'const handlePlaceBid = async () => {';
        if (code.includes(anchor)) {
            code = code.replace(anchor, refundLogic + '\n  ' + anchor);
            fs.writeFileSync('app/page.tsx', code, 'utf8');
            console.log("✅ REFUND ENGINE ONLINE: Pull-pattern security successfully wired.");
        } else {
            console.log("❌ SCRIPT FAULT: Could not find anchor to inject refund logic.");
        }
    } else {
        console.log("⚠️ ALREADY INJECTED: Refund engine is already in place.");
    }

} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
