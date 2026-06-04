const fs = require('fs');
const targetFile = 'app/page.tsx';
let code = fs.readFileSync(targetFile, 'utf8');

// STRIKE 1: Fix the NFT Address Bug
// Looks for the marketplace address sitting right next to 'tokenId' in your array 
// and swaps it to 'nftContract' (the standard variable for user input).
code = code.replace(/VAULT_V5_ADDRESS(\s*,\s*tokenId)/g, 'nftContract$1');

// STRIKE 2: Annihilate the 0.002 ETH Fee Override
// Finds any line that tries to force the fee to 0.002 and comments it out, 
// leaving your 1.5% math as the only active calculation.
code = code.replace(/.*feeToSend\s*=\s*.*0\.002.*/gi, '// [REMOVED 0.002 FEE OVERRIDE]');
code = code.replace(/.*feeToSend\s*=\s*parseEther\("0\.002"\).*/gi, '// [REMOVED 0.002 FEE OVERRIDE]');

fs.writeFileSync(targetFile, code, 'utf8');
console.log("🎯 Surgical strike executed: Contract args updated and legacy fee wiped.");
