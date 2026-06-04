const fs = require('fs');

try {
    let code = fs.readFileSync('app/page.tsx', 'utf8');

    // Flip the logic: Physical = 0.002 ETH, Digital = 0.0015 ETH
    code = code.replace(
        /isPhysical \? BigInt\("1500000000000000"\) : BigInt\("2000000000000000"\)/g, 
        'isPhysical ? BigInt("2000000000000000") : BigInt("1500000000000000")'
    );

    fs.writeFileSync('app/page.tsx', code, 'utf8');
    console.log("✅ FEE MATRIX CALIBRATED: Digital and Physical asset fees aligned.");
} catch (e) {
    console.error("❌ SCRIPT FAULT:", e.message);
}
