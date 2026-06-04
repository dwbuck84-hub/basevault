const fs = require('fs');
const targetFile = 'app/page.tsx';
let code = fs.readFileSync(targetFile, 'utf8');

// The exact block of crossed wires
const badLogic = `let assetTypeNum = 0;
      if (formType === 'digital') assetTypeNum = 1;
      if (formType === 'tokenized_nft') assetTypeNum = 2;`;

// The corrected mapping that matches your Smart Contract
const goodLogic = `let assetTypeNum = 0;
      if (formType === 'tokenized_nft') assetTypeNum = 1; // 1 = NFT
      if (formType === 'digital') assetTypeNum = 2; // 2 = Bounty`;

// Force the replacement
code = code.replace(/let assetTypeNum = 0;\s*if \(formType === 'digital'\) assetTypeNum = 1;\s*if \(formType === 'tokenized_nft'\) assetTypeNum = 2;/g, goodLogic);

fs.writeFileSync(targetFile, code, 'utf8');
console.log("🎯 Surgical strike executed: UI tabs are now perfectly wired to the Smart Contract enum.");
