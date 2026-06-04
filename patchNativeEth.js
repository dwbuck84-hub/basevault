const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // 1. Define the constant
    const oldAddrLine = 'const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";';
    const newAddrLine = 'const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";\nconst NATIVE_ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";';

    if (!code.includes('NATIVE_ETH_ADDRESS')) {
        code = code.replace(oldAddrLine, newAddrLine);
    }

    // 2. Patch handleCreateAuction logic
    // We only swap ETH_ADDRESS for NATIVE_ETH_ADDRESS in the listing flow
    code = code.replace(
        'const paymentToken = isUsdc ? USDC_ADDRESS : ETH_ADDRESS;',
        'const paymentToken = isUsdc ? USDC_ADDRESS : NATIVE_ETH_ADDRESS;'
    );
    code = code.replace(
        'const nftAddress = formType === \'tokenized_nft\' ? nftContractAddress : ETH_ADDRESS;',
        'const nftAddress = formType === \'tokenized_nft\' ? nftContractAddress : NATIVE_ETH_ADDRESS;'
    );

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ SURGICAL STRIKE COMPLETE: Native ETH addresses injected for listing logic.");
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
