const { createPublicClient, http, parseEther } = require('viem');
const { base } = require('viem/chains');

const VAULT_V5_ADDRESS = "0x8714D5f904a9D96db101CE03287Dd161BAD90ac5";
const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
const ABI = [{"inputs":[{"internalType":"uint256","name":"_price","type":"uint256"},{"internalType":"address","name":"_paymentToken","type":"address"},{"internalType":"uint8","name":"_assetType","type":"uint8"},{"internalType":"address","name":"_nftContract","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"uint256","name":"_durationDays","type":"uint256"}],"name":"listAsset","outputs":[],"stateMutability":"payable","type":"function"}];

async function check(type, label) {
    const publicClient = createPublicClient({ chain: base, transport: http() });
    try {
        await publicClient.simulateContract({
            address: VAULT_V5_ADDRESS,
            abi: ABI,
            functionName: 'listAsset',
            args: [parseEther("10000"), ETH_ADDRESS, type, ETH_ADDRESS, 0, 30],
            value: parseEther("0.002")
        });
        console.log(`✅ TEST PASSED: Asset Type ${type} (${label}) is VALID.`);
    } catch (e) {
        console.log(`❌ TEST FAILED: Asset Type ${type} (${label})`);
        console.log("   REVERT REASON:", e.message.split('\n')[0]);
    }
}

async function run() {
    await check(0, "Physical");
    await check(1, "Digital");
}
run();
