const { createPublicClient, http, parseEther } = require('viem');
const { base } = require('viem/chains');

const VAULT_V5_ADDRESS = "0x8714D5f904a9D96db101CE03287Dd161BAD90ac5";
const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
const ABI = [{"inputs":[{"internalType":"uint256","name":"_price","type":"uint256"},{"internalType":"address","name":"_paymentToken","type":"address"},{"internalType":"uint8","name":"_assetType","type":"uint8"},{"internalType":"address","name":"_nftContract","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"uint256","name":"_durationDays","type":"uint256"}],"name":"listAsset","outputs":[],"stateMutability":"payable","type":"function"}];

async function checkSafe() {
    const publicClient = createPublicClient({ chain: base, transport: http() });
    
    // Testing "The Minimalist Listing"
    // 1 ETH Price, 0 Payment Token, Type 0, Vault Address, Token 1, 30 Days
    try {
        await publicClient.simulateContract({
            address: VAULT_V5_ADDRESS,
            abi: ABI,
            functionName: 'listAsset',
            args: [parseEther("1"), ETH_ADDRESS, 0, VAULT_V5_ADDRESS, 1, 30],
            value: parseEther("0.002")
        });
        console.log("✅ SUCCESS: Minimalist listing accepted.");
    } catch (e) {
        console.log("❌ FAILED: Minimalist listing reverted.");
        // Try to dig deeper into the error
        console.log("Details:", e.shortMessage || e.message);
    }
}
checkSafe();
