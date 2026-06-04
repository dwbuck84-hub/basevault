const fs = require('fs');
const targetFile = 'app/page.tsx';
let code = fs.readFileSync(targetFile, 'utf8');

// The exact line we found from your grep output
const searchRegex = /args:\s*\[parsedPrice,\s*paymentToken,\s*assetTypeNum,\s*nftAddress,\s*tId,\s*BigInt\(durationDays\)\]/g;

// The new line with inline logic to auto-fill the Zero Address for non-NFTs
const replacementArgs = 'args: [parsedPrice, paymentToken, assetTypeNum, (assetTypeNum === 1 && nftAddress) ? nftAddress : "0x0000000000000000000000000000000000000000", (assetTypeNum === 1 && tId) ? tId : 0, BigInt(durationDays)],';

// Execute the swap
code = code.replace(searchRegex, replacementArgs);

fs.writeFileSync(targetFile, code, 'utf8');
console.log("🎯 Surgical strike executed: Auto-fill for Physical/Bounty items is now active.");
