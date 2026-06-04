const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Revert the nftAddress logic to use the Vault Address instead of NATIVE_ETH_ADDRESS
    // We want: if it's an NFT, use the form address. If not, use the Vault Address.
    const oldLogic = 'const nftAddress = formType === \'tokenized_nft\' ? nftContractAddress : NATIVE_ETH_ADDRESS;';
    const newLogic = 'const nftAddress = formType === \'tokenized_nft\' ? nftContractAddress : VAULT_V5_ADDRESS;';

    if (code.includes(oldLogic)) {
        code = code.replace(oldLogic, newLogic);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ NFT PLACEHOLDER FIXED: Using VAULT_V5_ADDRESS for physical/digital items.");
    } else {
        console.log("❌ SCRIPT FAULT: Could not find the nftAddress logic.");
    }
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
