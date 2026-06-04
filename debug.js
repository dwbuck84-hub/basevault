const { createPublicClient, http, parseEther, parseUnits } = require('viem');
const { base } = require('viem/chains');

// IMPORTANT: Update these with your exact current values for the listing you just tried
const VAULT_V5_ADDRESS = "0x8714D5f904a9D96db101CE03287Dd161BAD90ac5";
const NATIVE_ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ABI = [
  {"inputs":[{"internalType":"uint256","name":"_price","type":"uint256"},{"internalType":"address","name":"_paymentToken","type":"address"},{"internalType":"uint8","name":"_assetType","type":"uint8"},{"internalType":"address","name":"_nftContract","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"uint256","name":"_durationDays","type":"uint256"}],"name":"listAsset","outputs":[],"stateMutability":"payable","type":"function"}
];

async function debug() {
    const publicClient = createPublicClient({ chain: base, transport: http() });
    
    try {
        await publicClient.simulateContract({
            address: VAULT_V5_ADDRESS,
            abi: ABI,
            functionName: 'listAsset',
            // THESE ARE THE EXACT ARGUMENTS FROM YOUR FAILED ATTEMPT:
            args: [
                parseEther("10000"), // Price (adjust if needed)
                NATIVE_ETH_ADDRESS,  // Payment Token
                1,                   // Asset Type
                VAULT_V5_ADDRESS,    // Nft Contract (The one that was patched)
                0,                   // Token Id
                30                   // Duration
            ],
            value: parseEther("0.002") // Listing Fee
        });
        console.log("✅ Simulation Passed! Transaction should work.");
    } catch (e) {
        console.log("❌ REVERT REASON FOUND:");
        console.log(e.message);
    }
}
debug();
