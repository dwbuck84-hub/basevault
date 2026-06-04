const { createPublicClient, http, parseEther } = require('viem');
const { base } = require('viem/chains');

const VAULT_V5_ADDRESS = "0x8714D5f904a9D96db101CE03287Dd161BAD90ac5";
const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
const ABI = [{"inputs":[{"internalType":"uint256","name":"_price","type":"uint256"},{"internalType":"address","name":"_paymentToken","type":"address"},{"internalType":"uint8","name":"_assetType","type":"uint8"},{"internalType":"address","name":"_nftContract","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"uint256","name":"_durationDays","type":"uint256"}],"name":"listAsset","outputs":[],"stateMutability":"payable","type":"function"}];

async function check(assetType, nftAddr, label) {
    const publicClient = createPublicClient({ chain: base, transport: http() });
    try {
        await publicClient.simulateContract({
            address: VAULT_V5_ADDRESS,
            abi: ABI,
            functionName: 'listAsset',
            args: [parseEther("10000"), ETH_ADDRESS, assetType, nftAddr, 0, 30],
            value: parseEther("0.002")
        });
        console.log(`✅ SUCCESS: [Type ${assetType} | NFT Addr: ${nftAddr === VAULT_V5_ADDRESS ? 'VAULT' : '0x0'}]`);
    } catch (e) {
        console.log(`❌ FAILED: [Type ${assetType} | NFT Addr: ${nftAddr === VAULT_V5_ADDRESS ? 'VAULT' : '0x0'}]`);
    }
}

async function run() {
    console.log("Testing Configurations...");
    await check(0, VAULT_V5_ADDRESS, "Physical/Vault");
    await check(0, ETH_ADDRESS, "Physical/0x0");
    await check(1, VAULT_V5_ADDRESS, "Digital/Vault");
    await check(1, ETH_ADDRESS, "Digital/0x0");
}
run();
