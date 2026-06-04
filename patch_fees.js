const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');
const newFeeLogic = `const priceBigInt = BigInt(price);
const feeToSend = (priceBigInt * BigInt(15)) / BigInt(1000);`;
content = content.replace(/const feeToSend = .*/, newFeeLogic);
fs.writeFileSync('app/page.tsx', content, 'utf8');
console.log("✅ Fee logic updated to 1.5% in app/page.tsx");
