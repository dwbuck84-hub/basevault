const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Revert the nftAddress logic to use the Vault Address instead of ETH_ADDRESS
    const oldLogic = 'const nftAddress = formType === \'tokenized_nft\' ? nftContractAddress : ETH_ADDRESS;';
    const newLogic = 'const nftAddress = formType === \'tokenized_nft\' ? nftContractAddress : VAULT_V5_ADDRESS;';

    if (code.includes(oldLogic)) {
        code = code.replace(oldLogic, newLogic);
        fs.writeFileSync('app/page.tsx', code, 'utf8');
        console.log("✅ PATCH COMPLETE: nftContract reset to VAULT_V5_ADDRESS.");
    } else {
        console.log("❌ SCRIPT FAULT: Could not find the nftAddress logic.");
    }
} catch(e) { 
    console.error("❌ SCRIPT FAULT:", e.message); 
}
