const { createPublicClient, http, parseEther } = require('viem');
const { base } = require('viem/chains');

const VAULT_V5_ADDRESS = "0x8714D5f904a9D96db101CE03287Dd161BAD90ac5";
const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
const ABI = [{"inputs":[{"internalType":"uint256","name":"_price","type":"uint256"},{"internalType":"address","name":"_paymentToken","type":"address"},{"internalType":"uint8","name":"_assetType","type":"uint8"},{"internalType":"address","name":"_nftContract","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"uint256","name":"_durationDays","type":"uint256"}],"name":"listAsset","outputs":[],"stateMutability":"payable","type":"function"}];

async function testFee(fee, label) {
    const publicClient = createPublicClient({ chain: base, transport: http() });
    try {
        await publicClient.simulateContract({
            address: VAULT_V5_ADDRESS,
            abi: ABI,
            functionName: 'listAsset',
            args: [parseEther("10000"), ETH_ADDRESS, 0, VAULT_V5_ADDRESS, 0, 30],
            value: fee
        });
        console.log(`✅ SUCCESS: Fee ${label} is accepted.`);
    } catch (e) {
        console.log(`❌ FAILED: Fee ${label}. Revert: ${e.message.split('\n')[0]}`);
    }
}

async function run() {
    console.log("Testing Fees for Physical (Type 0)...");
    await testFee(parseEther("0.0015"), "0.0015");
    await testFee(parseEther("0.002"), "0.002");
    await testFee(parseEther("0"), "0 (Free)");
}
run();
