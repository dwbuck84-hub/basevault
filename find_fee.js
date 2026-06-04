const { createPublicClient, http, parseEther } = require('viem');
const { base } = require('viem/chains');

const VAULT_V5_ADDRESS = "0x8714D5f904a9D96db101CE03287Dd161BAD90ac5";
const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
const ABI = [{"inputs":[{"internalType":"uint256","name":"_price","type":"uint256"},{"internalType":"address","name":"_paymentToken","type":"address"},{"internalType":"uint8","name":"_assetType","type":"uint8"},{"internalType":"address","name":"_nftContract","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"uint256","name":"_durationDays","type":"uint256"}],"name":"listAsset","outputs":[],"stateMutability":"payable","type":"function"}];

async function checkFee(feeAmount) {
    const publicClient = createPublicClient({ chain: base, transport: http() });
    try {
        await publicClient.simulateContract({
            address: VAULT_V5_ADDRESS,
            abi: ABI,
            functionName: 'listAsset',
            args: [parseEther("1"), ETH_ADDRESS, 0, VAULT_V5_ADDRESS, 1, 30],
            value: parseEther(feeAmount)
        });
        console.log(`✅ FOUND IT: The contract accepts a fee of ${feeAmount} ETH.`);
        process.exit(0);
    } catch (e) {
        console.log(`❌ Rejected: Fee ${feeAmount} ETH.`);
    }
}

async function run() {
    const fees = ["0.005", "0.01", "0.05", "0.1"];
    for (const fee of fees) {
        await checkFee(fee);
    }
}
run();
