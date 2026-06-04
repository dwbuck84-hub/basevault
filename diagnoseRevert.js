const https = require('https');
const data = JSON.stringify({
    "jsonrpc": "2.0",
    "method": "eth_call",
    "params": [{
        "to": "0xA2ed6A0b531A94799397b4CF2dd29a945D3F0323",
        "data": "0xb6a40f69000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000038d7ea4c6800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f426173655661756c742041737365740000000000000000000000000000000000",
        "value": "0x55530283b585000"
    }, "latest"],
    "id": 1
});
const req = https.request({
    hostname: 'mainnet.base.org', port: 443, path: '/', method: 'POST', headers: { 'Content-Type': 'application/json' }
}, (res) => {
    let body = ''; res.on('data', (d) => body += d);
    res.on('end', () => {
        const r = JSON.parse(body);
        let hex = r.result || (r.error && r.error.data);
        if (hex && hex.startsWith('0x08c379a0')) {
            let str = '';
            for (let i = 138; i < hex.length; i += 2) {
                let code = parseInt(hex.substr(i, 2), 16);
                if (code > 31 && code < 127) str += String.fromCharCode(code);
            }
            console.log("\n🚨 CONTRACT REJECTED IT. REASON:", str.trim());
        } else if (r.error) {
            console.log("\n🚨 RPC ERROR:", r.error.message);
        } else if (hex === '0x') {
            console.log("\n🚨 NO REVERT STRING (Contract might be paused or empty)");
        } else {
            console.log("\n✅ THE NODE SAYS THIS TX IS VALID. MetaMask gas calculation is glitching.");
        }
    });
});
req.on('error', console.error); req.write(data); req.end();
