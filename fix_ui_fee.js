const fs = require('fs');
const targetFile = 'app/page.tsx';
let code = fs.readFileSync(targetFile, 'utf8');

const startStr = 'const calculateListingFee = () => {';
const startIndex = code.indexOf(startStr);

if (startIndex !== -1) {
    let bracketCount = 0;
    let endIndex = -1;
    let started = false;

    // Count brackets to safely find the exact end of the function
    for(let i = startIndex; i < code.length; i++) {
        if (code[i] === '{') { bracketCount++; started = true; }
        if (code[i] === '}') { bracketCount--; }
        if (started && bracketCount === 0) {
            endIndex = i + 1; 
            break;
        }
    }

    if (endIndex !== -1) {
        const newLogic = `const calculateListingFee = () => {
    const parsedPrice = parseFloat(formReservePrice) || 0;
    const percentageFee = parsedPrice * 0.015;
    return selectedCurrency === 'ETH' 
      ? \`\${percentageFee.toFixed(5)} ETH\` 
      : \`\\$\${percentageFee.toFixed(2)} USDC\`;
  }`;
        
        // Swap out the old logic
        code = code.substring(0, startIndex) + newLogic + code.substring(endIndex);
        fs.writeFileSync(targetFile, code, 'utf8');
        console.log("🎯 Surgical strike executed: UI text now perfectly calculates a universal 1.5%.");
    }
}
