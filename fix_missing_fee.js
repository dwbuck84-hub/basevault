const fs = require('fs');
const targetFile = 'app/page.tsx';
let code = fs.readFileSync(targetFile, 'utf8');

// Target the exact listAsset payload and force the 1.5% math inline
const listAssetRegex = /(functionName:\s*'listAsset',\s*args:\s*\[.*?\],\s*value:\s*)feeToSend/s;
const inlineMath = '$1isUsdc ? BigInt(0) : (parsedPrice * BigInt(15)) / BigInt(1000)';

code = code.replace(listAssetRegex, inlineMath);

fs.writeFileSync(targetFile, code, 'utf8');
console.log("🎯 Surgical strike executed: Fee math injected directly into the payload. 0 ETH bug annihilated.");
