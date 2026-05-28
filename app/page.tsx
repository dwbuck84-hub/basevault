'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { parseEther, formatEther, parseUnits, formatUnits, createPublicClient, http } from 'viem';
import { base } from 'wagmi/chains';
import { supabase } from '../lib/supabaseClient'; 
import { useSearchParams } from 'next/navigation'; 
import { 
  useAccount, 
  useConnect, 
  useDisconnect, 
  useWriteContract, 
  useBalance,
  useReadContract,
  useWaitForTransactionReceipt,
  useSwitchChain
} from 'wagmi';

// BASE MAINNET USDC & ORACLE
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";

// V4 MASTER CONTRACT ADDRESS
const VAULT_CONTRACT_ADDRESS = "0xd07bE49fe9ff12079f7619d85D5abEb236988C6A"; 
const DEVELOPER_ADMIN_ADDRESS = "0x635c225c13851C96ACC20d62aD06C8C794912463"; 

const ERC20_ABI = [{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];

const MARKETPLACE_ABI = [
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"},{"internalType":"enum BaseVaultMarketplaceV4.AssetType","name":"_assetType","type":"uint8"},{"internalType":"uint256","name":"_price","type":"uint256"},{"internalType":"address","name":"_paymentToken","type":"address"}],"name":"listAsset","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_ethAmountInWei","type":"uint256"}],"name":"getUsdcEquivalent","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"purchaseAsset","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"releaseEscrowFunds","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"bindBounty","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"totalListingsCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"listings","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"enum BaseVaultMarketplaceV4.AssetType","name":"assetType","type":"uint8"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"address","name":"paymentToken","type":"address"},{"internalType":"address","name":"seller","type":"address"},{"internalType":"address","name":"buyer","type":"address"},{"internalType":"enum BaseVaultMarketplaceV4.Status","name":"status","type":"uint8"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"withdrawFees","outputs":[],"stateMutability":"nonpayable","type":"function"}
];

interface Listing {
  id: number;
  type: 'physical_asset' | 'smart_bounty' | 'tokenized_nft'; 
  title: string;
  price: string; 
  buyNowPrice?: string; 
  bidsCount: number;
  category: string;
  seller: string;
  buyer: string;
  paymentToken: string;
  rating: number;
  ratingCount: number; 
  description: string;
  images: string[];
  duration?: string;
  status: 'Active' | 'EscrowLocked' | 'Settled' | 'Quarantined'; 
  highestBidder?: string; 
  nftContract?: string;
  nftTokenId?: string;
  buyerShippingAddress?: string;
  buyerShippingMethod?: string;
  trackingNumber?: string;
  escrowReleased: boolean;
  watermarkedFilePreview?: string;
  cleanFileUrl?: string; 
  governanceFlags: number; 
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0f1d] text-slate-400 p-6 font-mono">INITIALIZING INTERFACE TERMINAL...</div>}>
      <MarketplaceContent />
    </Suspense>
  );
}

function MarketplaceContent() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const contractBalance = useBalance({ address: VAULT_CONTRACT_ADDRESS });

  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [activeTab, setActiveTab] = useState<'browse' | 'list' | 'escrow_stream' | 'vault_dashboard'>('browse');
  const [browseSubTab, setBrowseSubTab] = useState<'all' | 'physical_asset' | 'smart_bounty' | 'tokenized_nft'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(12); 
  const [selectedItem, setSelectedItem] = useState<Listing | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [isUploadingToIpfs, setIsUploadingToIpfs] = useState<Record<number, boolean>>({});
  const [deliveryPayloads, setDeliveryPayloads] = useState<Record<number, string>>({});
  const [ethUsdRate, setEthUsdRate] = useState<number>(3100); 
  const [isProcessing, setIsProcessing] = useState(false);

  const [activeChatGigId, setActiveChatGigId] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLogs, setChatLogs] = useState<Array<{sender: string, text: string}>>([]);

  const [formType, setFormType] = useState<'physical_asset' | 'smart_bounty' | 'tokenized_nft'>('physical_asset');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Sneakers & Apparel');
  const [formPrice, setFormPrice] = useState(''); 
  const [formBuyNowPrice, setFormBuyNowPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<'ETH' | 'USDC'>('ETH');

  const itemCategories = ["Sneakers & Apparel", "Luxury Chronographs", "Hardware Components", "Vintage Electronics", "Collectibles & Art Assets"];
  const bountyCategories = ["Software Development", "Interface Design", "Smart Contract Audit", "Digital Content Generation", "Protocol Optimization"];
  const nftCategories = ["Generative Art Collections", "Virtual Environment Nodes", "Utility Access Passes", "Gaming Registry Keys"];

  const [listings, setListings] = useState<Listing[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!activeChatGigId) return;

    const fetchChatHistory = async () => {
      const { data, error } = await supabase
        .from('marketplace_chats')
        .select('sender, message_text')
        .eq('gig_id', activeChatGigId)
        .order('id', { ascending: true });

      if (!error && data) {
        setChatLogs(data.map(m => ({ sender: m.sender, text: m.message_text })));
      }
    };
    fetchChatHistory();

    const telemetryChannel = supabase
      .channel(`gig_telemetry_${activeChatGigId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'marketplace_chats',
        filter: `gig_id=eq.${activeChatGigId}`
      }, (payload) => {
        const newMsg = payload.new;
        setChatLogs(prev => [...prev, { sender: newMsg.sender, text: newMsg.message_text }]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(telemetryChannel);
    };
  }, [activeChatGigId]);

  useEffect(() => {
    const fetchCurrentPriceFeed = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        if (data?.ethereum?.usd) setEthUsdRate(Number(data.ethereum.usd));
      } catch (err) {
        console.error("Failed to sync fiat translation ticker:", err);
      }
    };
    fetchCurrentPriceFeed();
    const priceTickerInterval = setInterval(fetchCurrentPriceFeed, 60000); 
    return () => clearInterval(priceTickerInterval);
  }, []);

  const { data: totalListingsCount, refetch: reloadContractCount } = useReadContract({
    address: VAULT_CONTRACT_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'totalListingsCount',
  });

  const sourceLiveRegistry = async () => {
    if (!totalListingsCount) return;
    const publicClient = createPublicClient({ chain: base, transport: http() });
    const activeChainListings: Listing[] = [];
    const count = Number(totalListingsCount);
    const boundaryStop = Math.max(1, count - visibleCount + 1);

    for (let i = count; i >= boundaryStop; i--) {
      try {
        const structData = await publicClient.readContract({
          address: VAULT_CONTRACT_ADDRESS,
          abi: MARKETPLACE_ABI,
          functionName: 'listings',
          args: [BigInt(i)],
        }) as any;

        if (structData && Number(structData.status) !== 3) {
          const isUsdc = structData.paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase();
          const formattedPrice = isUsdc ? formatUnits(structData.price, 6) : formatEther(structData.price);
          
          activeChainListings.push({
            id: i,
            type: ['physical_asset', 'smart_bounty', 'tokenized_nft'][Number(structData.assetType)] as 'physical_asset' | 'smart_bounty' | 'tokenized_nft',
            title: structData.title || `Asset Node #${i}`,
            price: formattedPrice,
            buyNowPrice: undefined, 
            paymentToken: structData.paymentToken,
            bidsCount: 0,
            category: "General Registry",
            seller: structData.seller,
            buyer: structData.buyer,
            rating: 5.0,
            ratingCount: 0,
            description: "",
            images: ["https://picsum.photos/id/24/800/600"],
            status: ['Active', 'EscrowLocked', 'Settled', 'Quarantined'][Number(structData.status)] as any,
            escrowReleased: Number(structData.status) === 2,
            governanceFlags: 0
          });
        }
      } catch (err) {
        console.error(`Blockchain sync mismatch on array node #${i}:`, err);
      }
    }
    setListings(activeChainListings);
  };

  useEffect(() => { sourceLiveRegistry(); }, [totalListingsCount, visibleCount]);

  const convertToUsd = (amount: string, isUsdc: boolean) => {
    if (isUsdc) return parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const val = parseFloat(amount);
    return isNaN(val) ? '0.00' : (val * ethUsdRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calculateMarketplaceTake = (priceStr: string, isUsdc: boolean) => {
    const totalAmt = parseFloat(priceStr);
    if (isNaN(totalAmt)) return { sellerCut: '0.0000', platformCut: '0.0000', sellerUsd: '0.00', platformUsd: '0.00' };
    const sellerAmt = totalAmt * 0.96;
    const platAmt = totalAmt * 0.04;
    return {
      sellerCut: sellerAmt.toFixed(4),
      platformCut: platAmt.toFixed(4),
      sellerUsd: isUsdc ? sellerAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (sellerAmt * ethUsdRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      platformUsd: isUsdc ? platAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (platAmt * ethUsdRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    };
  };

  // V4 LIVE PARITY FEE CALCULATOR (Synced with Mobile App)
  const calculateUnifiedFee = useCallback((priceInput: string, currency: 'ETH' | 'USDC', formAssetType: 'physical_asset' | 'smart_bounty' | 'tokenized_nft') => {
    const numericPrice = parseFloat(priceInput) || 0;
    const usdValueOfItem = currency === 'USDC' ? numericPrice : numericPrice * ethUsdRate;

    // 1. BOUNTY ROUTE (0.002 ETH Flat)
    if (formAssetType === 'smart_bounty') {
      return currency === 'ETH' ? 0.002 : (0.002 * ethUsdRate);
    }
    
    // 2. NFT ROUTE (0.0015 ETH Flat)
    if (formAssetType === 'tokenized_nft') {
      return currency === 'ETH' ? 0.0015 : (0.0015 * ethUsdRate);
    }

    // 3. PHYSICAL ASSET ROUTE (Scales at $500)
    if (usdValueOfItem > 500) {
      return currency === 'ETH' ? (numericPrice * 0.015) : (numericPrice * 0.015);
    } else {
      return currency === 'ETH' ? 0.0015 : (0.0015 * ethUsdRate);
    }
  }, [ethUsdRate]);

  const handleFreelancerSandboxUpload = async (gigId: number, file: File) => {
    if (!file) return;
    setIsUploadingToIpfs(prev => ({ ...prev, [gigId]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/ipfs-upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (data?.IpfsHash) {
        setDeliveryPayloads(prev => ({ ...prev, [gigId]: data.IpfsHash }));
        alert(`🎉 DECENTRALIZED SANDBOX SECURED!\n\nContent Hash: ${data.IpfsHash}`);
      } else {
        throw new Error("Invalid IPFS registry returns.");
      }
    } catch (err) {
      alert("Network Error: Decentralized routing frame failed to pin element node.");
    } finally {
      setIsUploadingToIpfs(prev => ({ ...prev, [gigId]: false }));
    }
  };

  const handleBroadcastDeliveryProof = async (gigId: number) => {
    if (chainId !== base.id) return alert("Switch to Base Mainnet");
    const fileHash = deliveryPayloads[gigId];
    if (!fileHash) return alert("No cryptographic payload attached to node pipeline.");
    
    const senderLabel = address ? address.slice(0,6) + "..." + address.slice(-4) : "SYSTEM";
    const deliveryMessage = `📦 SECURE PAYLOAD DELIVERED: https://gateway.pinata.cloud/ipfs/${fileHash}`;
    
    const { error } = await supabase
      .from('marketplace_chats')
      .insert([{ gig_id: gigId, sender: senderLabel, message_text: deliveryMessage }]);

    if (error) {
      console.error("Telemetry breakdown:", error);
      alert("Failed to broadcast delivery.");
    } else {
      alert("✅ Payload broadcasted to buyer via encrypted telemetry.");
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chainId !== base.id) return alert("Switch to Base Mainnet");
    setIsProcessing(true);

    try {
      const assetTypeEnum = { physical_asset: 0, smart_bounty: 1, tokenized_nft: 2 }[formType];
      const newId = BigInt(Date.now());
      const exactFeeRequired = calculateUnifiedFee(formPrice, selectedCurrency, formType);

      if (selectedCurrency === 'ETH') {
        let totalValueEth = exactFeeRequired;
        if (formType === 'smart_bounty') totalValueEth += parseFloat(formPrice);
        
        const valueInWei = parseEther(totalValueEth.toFixed(18));
        
        await writeContractAsync({ 
          address: VAULT_CONTRACT_ADDRESS, 
          abi: MARKETPLACE_ABI, 
          functionName: 'listAsset', 
          args: [newId, assetTypeEnum, parseEther(formPrice), ETH_ADDRESS], 
          value: valueInWei 
        });
      } else {
        const feeConvertedToEth = exactFeeRequired / ethUsdRate; 
        const feeInWei = parseEther(feeConvertedToEth.toFixed(18));
        
        let totalUsdcNeeded = 0;
        if (formType === 'smart_bounty') totalUsdcNeeded += parseFloat(formPrice);
        
        if (totalUsdcNeeded > 0) {
           await writeContractAsync({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: 'approve', args: [VAULT_CONTRACT_ADDRESS, parseUnits(totalUsdcNeeded.toString(), 6)] });
        }
        
        await writeContractAsync({ 
          address: VAULT_CONTRACT_ADDRESS, 
          abi: MARKETPLACE_ABI, 
          functionName: 'listAsset', 
          args: [newId, assetTypeEnum, parseUnits(formPrice, 6), USDC_ADDRESS],
          value: feeInWei
        });
      }
      alert("✅ Node Listed Successfully");
      reloadContractCount();
    } catch (err) {
      console.error(err);
      alert("Transaction Failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuyNow = async () => {
    if (!selectedItem) return;
    if (chainId !== base.id) return alert("Switch to Base Mainnet");
    setIsProcessing(true);
    try {
      const isUsdc = selectedItem.paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase();
      const rawPrice = isUsdc ? parseUnits(selectedItem.price, 6) : parseEther(selectedItem.price);
      
      if (isUsdc) {
        await writeContractAsync({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: 'approve', args: [VAULT_CONTRACT_ADDRESS, rawPrice] });
        await writeContractAsync({ address: VAULT_CONTRACT_ADDRESS, abi: MARKETPLACE_ABI, functionName: 'purchaseAsset', args: [BigInt(selectedItem.id)] });
      } else {
        await writeContractAsync({ address: VAULT_CONTRACT_ADDRESS, abi: MARKETPLACE_ABI, functionName: 'purchaseAsset', args: [BigInt(selectedItem.id)], value: rawPrice });
      }
      alert("✅ Escrow Locked Successfully");
      setSelectedItem(null);
      reloadContractCount();
    } catch (err) {
      console.error(err);
      alert("Transaction Failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (chainId !== base.id) return alert("Switch to Base Mainnet");
    if (parseFloat(bidAmount) <= 0) return alert("Bid position evaluation failure.");
    setIsProcessing(true);
    try {
      const isUsdc = selectedItem.paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase();
      const rawPrice = isUsdc ? parseUnits(bidAmount, 6) : parseEther(bidAmount);
      
      if (isUsdc) {
        await writeContractAsync({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: 'approve', args: [VAULT_CONTRACT_ADDRESS, rawPrice] });
        await writeContractAsync({ address: VAULT_CONTRACT_ADDRESS, abi: MARKETPLACE_ABI, functionName: 'purchaseAsset', args: [BigInt(selectedItem.id)] });
      } else {
        await writeContractAsync({ address: VAULT_CONTRACT_ADDRESS, abi: MARKETPLACE_ABI, functionName: 'purchaseAsset', args: [BigInt(selectedItem.id)], value: rawPrice });
      }
      alert("✅ Escrow Locked Successfully");
      setSelectedItem(null);
      setBidAmount('');
      reloadContractCount();
    } catch (err) {
      console.error(err);
      alert("Transaction Failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuyerReleaseGigEscrow = async (id: number) => {
    if (chainId !== base.id) return alert("Switch to Base Mainnet");
    try {
      await writeContractAsync({ address: VAULT_CONTRACT_ADDRESS, abi: MARKETPLACE_ABI, functionName: 'releaseEscrowFunds', args: [BigInt(id)] });
      alert("✅ Funds Disbursed");
      reloadContractCount();
    } catch (e) { console.error(e); }
  };

  const handleAdminWithdrawLiquidity = async () => {
    if (!mounted || !isConnected) return;
    if (address?.toLowerCase() !== DEVELOPER_ADMIN_ADDRESS.toLowerCase()) {
      alert("Security Error: Administrative operation revoked.");
      return;
    }
    if (chainId !== base.id) return alert("Switch to Base Mainnet");
    try {
      await writeContractAsync({ address: VAULT_CONTRACT_ADDRESS, abi: MARKETPLACE_ABI, functionName: 'withdrawFees' });
    } catch(e) { console.error(e); }
  };

  const sendChatMessage = async (gigId: number) => {
    if (!chatMessage.trim() || !address) return alert("Connect wallet to broadcast telemetry.");
    const senderLabel = address.slice(0,6) + "..." + address.slice(-4);
    const { error } = await supabase.from('marketplace_chats').insert([{ gig_id: gigId, sender: senderLabel, message_text: chatMessage }]);
    if (error) console.error("Telemetry distribution breakdown:", error);
    else setChatMessage('');
  };

  if (id) {
    const activeIndexItem = listings.find(l => l.id === Number(id));
    return (
      <div className="min-h-screen bg-black text-green-400 p-6 font-mono flex flex-col justify-between">
        <div className="border border-green-800 p-6 max-w-2xl mx-auto w-full bg-neutral-950 rounded shadow-lg shadow-green-900/10">
          <div className="border-b border-green-800 pb-4 mb-4 flex justify-between items-center">
            <span className="font-bold text-lg">VAULT_STATION // ITEM_ID #{id}</span>
            <span className="text-xs px-2 py-0.5 border border-green-500 rounded animate-pulse">LIVE DATA</span>
          </div>
          
          <div className="space-y-2 text-sm text-slate-300">
            <div><span className="text-green-500 font-bold">Contract Deployment:</span> {VAULT_CONTRACT_ADDRESS}</div>
            <div><span className="text-green-500 font-bold">Vault Deposit:</span> {activeIndexItem?.price || "0.0"} {activeIndexItem?.paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase() ? 'USDC' : 'ETH'}</div>
            <div><span className="text-green-500 font-bold">Seller Wallet:</span> {activeIndexItem?.seller || "SYNCING REGISTERED NODE..."}</div>
            <div><span className="text-green-500 font-bold">Escrow Status:</span> <span className="text-white bg-green-900 px-1 font-bold">{activeIndexItem?.status || "ACTIVE_ESCROW"}</span></div>
            <div><span className="text-green-500 font-bold">Tracking Code:</span> {activeIndexItem?.cleanFileUrl ? "CIPHER_MANIFEST_ATTACHED" : "AWAITING_SHIPMENT"}</div>
          </div>

          <div className="mt-8 pt-4 border-t border-green-800 flex justify-between items-center">
            <button onClick={() => window.location.href = '/'} className="text-neutral-500 hover:text-white transition text-xs">
              ← Return To Main Dashboard
            </button>
            {activeIndexItem?.status === 'Active' && (
              <button onClick={() => handleBuyerReleaseGigEscrow(Number(id))} className="bg-green-500 text-black font-bold px-4 py-2 rounded text-xs hover:bg-green-400 transition tracking-wider">
                Confirm Receipt & Release Funds
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-0 m-0 w-full bg-[#0a0f1d] text-slate-100">
      {mounted && !tosAccepted && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#10172a] border border-cyan-500/30 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest font-mono">// SECURITY ACCESS INITIALIZATION //</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              BaseVault Market is a decentralized, peer-to-peer open-source interface. Prohibitions protect distribution limits regarding weapons, chemical compounds, explicit pornography, or human tissues.
            </p>
            <button onClick={() => setTosAccepted(true)} className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 rounded text-black font-black text-xs tracking-widest uppercase">
              Cryptographically Sign Agreement
            </button>
          </div>
        </div>
      )}

      {mounted && isConnected && chainId !== base.id && (
        <div className="bg-gradient-to-r from-rose-600 to-amber-600 px-4 py-2 text-center font-mono text-[10px] uppercase tracking-widest font-black flex items-center justify-center gap-3 shadow-inner text-white sticky top-0 z-50">
          <span>⚠️ SYSTEM TERMINAL MISALIGNED: WORKSPACE DETECTED ALTERNATE LAYER SEQUENCE</span>
          <button onClick={() => switchChain?.({ chainId: base.id })} className="bg-white text-rose-700 px-3 py-1 rounded font-black text-[9px] hover:bg-slate-100 transition-colors">
            FORCE ALIGN BASE NETWORK
          </button>
        </div>
      )}

      <nav className="p-4 md:p-5 border-b border-cyan-500/20 sticky top-0 bg-[#0e1424]/90 backdrop-blur-xl z-40 shadow-lg flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(34,211,153,0.4)]">
            BASEVAULT MARKET
          </h1>
          <span className="text-[8px] uppercase font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40 tracking-widest">
            NODE OPEN_SOURCE
          </span>
        </div>
        
        <div className="flex items-center justify-center sm:justify-end gap-4 md:gap-6 text-[10px] md:text-xs font-black tracking-widest uppercase w-full sm:w-auto overflow-x-auto no-scrollbar py-1">
          {(['browse', 'list', 'escrow_stream', 'vault_dashboard'] as const).map(tab => (
            <button 
              key={tab} onClick={() => setActiveTab(tab)} 
              className={`transition-all whitespace-nowrap relative py-1 ${activeTab === tab ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-emerald-400" : "text-slate-400 hover:text-white"}`}
            >
              {tab === 'escrow_stream' ? 'Bounties Escrow' : tab === 'vault_dashboard' ? 'Vault Dashboard' : tab === 'list' ? 'Deploy Contract' : 'Index Browse'}
            </button>
          ))}
          <div className="h-4 w-[1px] bg-slate-800" />
          
          {mounted && isConnected ? (
            <button onClick={() => disconnect()} className="px-3 py-1.5 rounded bg-[#131b30] text-emerald-400 border border-cyan-500/25 truncate max-w-[140px] font-mono text-[11px]">
              {address?.slice(0, 6)}...{address?.slice(-4)} [OUT]
            </button>
          ) : (
            <div className="flex gap-1.5 shrink-0">
              {mounted && connectors.slice(0, 2).map((connector) => (
                <button key={connector.uid} onClick={() => connect({ connector })} className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold text-[10px] uppercase">
                  {connector.name.replace('Wallet', '')}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
        
        <div className="lg:col-span-3 space-y-6">

          {activeTab === 'browse' && (
            <div className="space-y-6">
              <div className="border-l-4 border-cyan-400 pl-3 md:pl-4">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase">Index Registry</h1>
                <p className="text-slate-400 text-xs mt-0.5">Advanced structural system for verified decentralized settlement nodes.</p>
              </div>

              <div id="frame" className="w-full max-w-[728px] mb-6">
                <iframe data-aa="2438016" src="//acceptable.a-ads.com/2438016/?size=Adaptive" className="border-0 p-0 w-full h-[90px] overflow-hidden block" />
              </div>

              <div className="w-full max-w-xl">
                <input type="text" placeholder="// SEARCH INDEX LEDGER CATEGORIES..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3.5 bg-[#11182c] border border-cyan-500/30 focus:border-emerald-400 rounded outline-none text-xs text-white font-mono tracking-wider transition-all" />
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {(['all', 'physical_asset', 'smart_bounty', 'tokenized_nft'] as const).map((tab) => (
                  <button key={tab} onClick={() => setBrowseSubTab(tab)} className={`px-4 py-2 rounded text-[9px] md:text-[10px] font-black uppercase tracking-widest border shrink-0 ${browseSubTab === tab ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-black border-transparent shadow-md' : 'bg-[#11182c] text-slate-400 border-slate-800'}`}>{tab === 'physical_asset' ? 'Physical Assets' : tab === 'smart_bounty' ? 'Service Bounties' : tab === 'tokenized_nft' ? 'Tokenized NFTs' : 'All Contracts'}</button>
                ))}
              </div>

              {listings.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-600 font-mono text-xs">// NO ACTIVE REGISTRY ENTRIES LOADED FROM NODE //</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {listings.filter(i => (browseSubTab === 'all' || i.type === browseSubTab) && (i.title.toLowerCase().includes(searchTerm.toLowerCase()) || i.category.toLowerCase().includes(searchTerm.toLowerCase()))).map(item => (
                    <div key={item.id} onClick={() => { setSelectedItem(item); setCurrentImageIndex(0); }} className="bg-[#10172a] border border-slate-800 hover:border-cyan-400 rounded-lg overflow-hidden cursor-pointer hover:bg-[#141d36] transition-all duration-300 flex flex-col justify-between shadow-md">
                      <div className="relative bg-[#090d16] aspect-video flex items-center justify-center border-b border-slate-800 overflow-hidden">
                        <img src={item.images[0]} alt="" className="w-full h-full object-cover opacity-90" />
                        <span className="absolute bottom-2 left-2 bg-[#0e1424]/90 backdrop-blur-md px-2.5 py-0.5 rounded text-[8px] font-black tracking-widest text-cyan-400 uppercase border border-cyan-500/20">{item.type.replace('_', ' ')}</span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center text-[9px] font-black tracking-wider uppercase mb-1.5 text-slate-500">
                            <span className="truncate pr-1">{item.category}</span>
                            <span className="text-amber-400">{item.paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase() ? 'USDC' : 'ETH'}</span>
                          </div>
                          <div className="font-black text-sm text-slate-200 truncate uppercase">{item.title}</div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-between items-end">
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase font-black">Escrow Value</p>
                            <p className="text-emerald-400 text-base font-black">{item.price} <span className="text-xs font-normal text-slate-500">{item.paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase() ? 'USDC' : 'ETH'}</span></p>
                            <p className="text-[9px] text-slate-400 font-mono">${convertToUsd(item.price, item.paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase())} USD</p>
                          </div>
                          <span className="text-[9px] font-bold bg-[#090d16] text-cyan-400 px-2 py-1 rounded border border-cyan-500/20 uppercase">{item.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'list' && (
            <div className="max-w-xl mx-auto w-full">
              <div className="mb-6 border-l-4 border-cyan-400 pl-3">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase">List Asset Node</h1>
              </div>
              <form onSubmit={handleCreateListing} className="bg-[#10172a] border border-slate-800 p-4 md:p-6 rounded-lg space-y-5 shadow-xl">
                <div className="grid grid-cols-3 gap-2">
                  {(['physical_asset', 'smart_bounty', 'tokenized_nft'] as const).map(type => (
                    <button key={type} type="button" onClick={() => setFormType(type)} className={`py-2.5 rounded font-black uppercase text-[9px] border ${formType === type ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent' : 'bg-[#090d16] border-slate-800 text-slate-500'}`}>{type.replace('_', ' ')}</button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Asset System Title</label>
                    <input type="text" required placeholder="BOUNTY_PERFORMANCE_CODE" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full p-2.5 bg-[#090d16] border border-slate-800 rounded outline-none text-xs text-white font-mono uppercase" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Operational Classification</label>
                    <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full p-2.5 bg-[#090d16] border border-slate-800 rounded outline-none text-xs text-zinc-200 font-mono">
                      {formType === 'physical_asset' && itemCategories.map((cat, idx) => <option key={idx} value={cat}>{cat.toUpperCase()}</option>)}
                      {formType === 'smart_bounty' && bountyCategories.map((cat, idx) => <option key={idx} value={cat}>{cat.toUpperCase()}</option>)}
                      {formType === 'tokenized_nft' && nftCategories.map((cat, idx) => <option key={idx} value={cat}>{cat.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Settlement Currency</label>
                  <select value={selectedCurrency} onChange={e => setSelectedCurrency(e.target.value as 'ETH' | 'USDC')} className="w-full p-2.5 bg-[#090d16] border border-slate-800 rounded outline-none text-xs text-zinc-200 font-mono">
                    <option value="ETH">ETH (Base Native)</option>
                    <option value="USDC">USDC (Base Token)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Base Registry Cost ({selectedCurrency})</label>
                    <div className="relative">
                      <input type="number" step="0.0001" required placeholder="0.00" value={formPrice} onChange={e => setFormPrice(e.target.value)} className="w-full p-2.5 bg-[#090d16] border border-slate-800 rounded outline-none text-xs font-mono font-bold text-emerald-400" />
                      <div className="absolute right-2 top-2.5 text-[8px] font-mono text-slate-400">≈ ${convertToUsd(formPrice, selectedCurrency === 'USDC')}</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Immediate Buyout Value ({selectedCurrency})</label>
                    <input type="number" step="0.0001" placeholder="0.00" value={formBuyNowPrice} onChange={e => setFormBuyNowPrice(e.target.value)} className="w-full p-2.5 bg-[#090d16] border border-slate-800 rounded outline-none text-xs font-mono text-slate-400" />
                  </div>
                </div>

                {formPrice && parseFloat(formPrice) > 0 && (
                  <div className="p-3 bg-[#090d16] border border-cyan-500/10 rounded font-mono text-[9px] space-y-1 text-slate-400">
                    <p className="text-cyan-400 font-black">// CONTRACT DISBURSEMENT SPLIT BREAKDOWN (4% PLATFORM CUT)</p>
                    <p>Seller Net Yield: <span className="text-slate-200 font-bold">{calculateMarketplaceTake(formPrice, selectedCurrency === 'USDC').sellerCut} {selectedCurrency}</span> [${calculateMarketplaceTake(formPrice, selectedCurrency === 'USDC').sellerUsd} USD]</p>
                    <p>Platform Protocol Fee: <span className="text-emerald-400 font-bold">{calculateMarketplaceTake(formPrice, selectedCurrency === 'USDC').platformCut} {selectedCurrency}</span> [${calculateMarketplaceTake(formPrice, selectedCurrency === 'USDC').platformUsd} USD]</p>
                    <p className="text-amber-400 mt-2">// DYNAMIC PARITY DEPLOYMENT COST: {calculateUnifiedFee(formPrice, selectedCurrency, formType).toFixed(3)} {selectedCurrency === 'USDC' ? 'USDC Equivalent' : 'ETH'}</p>
                  </div>
                )}

                <div>
                  <textarea rows={2} placeholder="SPECIFY TECHNICAL CONDITIONS..." value={formDescription} onChange={e => setFormDescription(e.target.value)} className="w-full p-2.5 bg-[#090d16] border border-slate-800 rounded outline-none text-xs text-slate-200 font-mono resize-none" />
                </div>

                <button type="submit" disabled={isProcessing || (isConnected && chainId !== base.id)} className="w-full bg-gradient-to-r from-emerald-400 to-cyan-500 py-3.5 rounded font-black text-xs text-black uppercase disabled:opacity-40">
                  {chainId !== base.id ? '// WIREFLOW MISALIGNED - SWITCH TO BASE //' : isProcessing ? '// WAITING ON SEQUENCER...' : 'Broadcast Registry Transaction'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'escrow_stream' && (
            <div className="space-y-4">
              <div className="border-l-4 border-cyan-400 pl-3">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase">Bounties Escrow Stream</h1>
                <p className="text-slate-400 text-xs">Immutable decentralized IPFS sandbox prevents asset leakage prior to clearance loop signatures.</p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
                <div className="xl:col-span-2 space-y-3">
                  {listings.filter(i => i.type === 'smart_bounty').length === 0 ? (
                    <div className="border border-dashed border-slate-800 rounded-lg p-8 text-center text-slate-600 font-mono text-xs">// NO ACTIVE SERVICE PIPELINES INITIALIZED ON NETWORK //</div>
                  ) : (
                    listings.filter(i => i.type === 'smart_bounty').map(gig => {
                      const isUsdc = gig.paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase();
                      return (
                      <div key={gig.id} className={`p-4 md:p-5 rounded-lg border transition-all duration-300 ${activeChatGigId === gig.id ? 'bg-[#141e36] border-cyan-400' : 'bg-[#10172a] border-slate-800'}`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start">
                          <div>
                            <span className={`text-[8px] font-mono font-black tracking-widest uppercase px-2 py-0.5 rounded border ${gig.escrowReleased ? 'bg-emerald-950 text-emerald-400 border-emerald-500/20' : 'bg-amber-950 text-amber-400 border-amber-500/20'}`}>
                              {gig.escrowReleased ? 'FUNDS DISBURSED' : 'VAULT ESCROW ACTIVE'}
                            </span>
                            <h3 className="text-base font-black text-white mt-2 uppercase">{gig.title}</h3>
                            <p className="text-[11px] text-slate-400 font-mono mt-1">Value allocation: <span className="text-emerald-400 font-bold">{gig.price} {isUsdc ? 'USDC' : 'ETH'}</span> [${convertToUsd(gig.price, isUsdc)} USD]</p>
                          </div>
                          <button onClick={() => setActiveChatGigId(gig.id)} className="text-[10px] font-black text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-3 py-2 rounded uppercase mt-2 sm:mt-0">CONNECT COMM CHANNEL</button>
                        </div>

                        {mounted && address?.toLowerCase() === gig.seller.toLowerCase() && !gig.escrowReleased && (
                          <div className="mt-4 p-3.5 bg-[#090d16] border border-cyan-500/20 rounded space-y-3">
                            <p className="text-[9px] font-black text-cyan-400 font-mono">// CONTRACTOR CONTROL: SUBMIT COMPLETED WORK</p>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <label className="flex-1 bg-[#10172a] border border-slate-800 p-2 rounded text-[11px] text-center font-mono cursor-pointer text-slate-400 hover:border-cyan-500 transition-colors">
                                {isUploadingToIpfs[gig.id] ? "🧬 PINNING TO IPFS HARDENED EDGE..." : deliveryPayloads[gig.id] ? "✅ CIPHER MANIFEST CACHED" : "CHOOSE PRODUCTION COMPLETED FILE ZIP/ARCHIVE"}
                                <input type="file" className="hidden" disabled={isUploadingToIpfs[gig.id]} onChange={e => e.target.files?.[0] && handleFreelancerSandboxUpload(gig.id, e.target.files[0])} />
                              </label>
                              {deliveryPayloads[gig.id] && (
                                <button onClick={() => handleBroadcastDeliveryProof(gig.id)} disabled={chainId !== base.id} className="bg-emerald-400 text-black font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded disabled:opacity-40">Broadcast Delivery Proof</button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )})
                  )}
                </div>

                <div className="bg-[#10172a] border border-slate-800 rounded p-4 min-h-[300px] flex flex-col justify-between shadow-xl">
                  <div>
                    <h3 className="font-black text-[10px] uppercase text-slate-500 tracking-widest mb-3 border-b border-slate-800/60 pb-2">// LIVE TELEMETRY STREAM</h3>
                    {activeChatGigId ? (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {chatLogs.map((msg, idx) => {
                          const isUser = address && msg.sender.toLowerCase() === (address.slice(0,6) + "..." + address.slice(-4)).toLowerCase();
                          return (
                            <div key={idx} className={`p-2.5 rounded text-[11px] font-mono ${isUser ? 'bg-[#141e36] text-cyan-300 border border-cyan-500/20 ml-auto max-w-[90%]' : 'bg-[#090d16] text-slate-300 border border-slate-800 max-w-[90%]'}`}>
                              <p className="text-[7px] text-slate-500 uppercase tracking-widest font-black mb-0.5">{msg.sender}</p>
                              <p className="break-words leading-tight">{msg.text}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-600 text-[10px] font-mono text-center pt-16">// STANDBY // LINK CHAT TO ACTIVATE STREAM</p>
                    )}
                  </div>
                  {activeChatGigId && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex gap-1.5">
                      <input type="text" placeholder="BROADCAST STRINGS ENCRYPTED..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage(activeChatGigId)} className="flex-1 bg-[#090d16] border border-slate-800 text-[11px] p-2 rounded outline-none text-white font-mono" />
                      <button onClick={() => sendChatMessage(activeChatGigId)} className="bg-zinc-200 text-black px-3 rounded text-[10px] font-black uppercase">SIG</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vault_dashboard' && (
            <div className="space-y-4">
              {mounted && isConnected && address?.toLowerCase() === DEVELOPER_ADMIN_ADDRESS.toLowerCase() && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div>
                    <p className="text-[10px] text-emerald-400 font-black uppercase font-mono">// ADMINISTRATIVE ROOT SIGNATURE CONFIRMED //</p>
                    <p className="text-xs text-slate-400 font-mono mt-1">Contract Accumulation Balances: <span className="text-emerald-400 font-bold">{contractBalance.data ? formatEther(contractBalance.data.value) : '0.00'} ETH</span></p>
                  </div>
                  <button onClick={handleAdminWithdrawLiquidity} disabled={chainId !== base.id} className="bg-emerald-500 text-black font-black text-xs px-5 py-3 rounded uppercase tracking-wider disabled:opacity-40">Execute Vault Payout</button>
                </div>
              )}

              <div className="bg-[#10172a] border border-slate-800 p-4 rounded-lg text-xs space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest font-mono text-cyan-400">// ESCROW ORDERS MANAGEMENT (4% PROTOCOL FEE ENFORCED)</h3>
                {listings.filter(i => i.type === 'smart_bounty').map(gig => {
                  const isUsdc = gig.paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase();
                  return (
                  <div key={gig.id} className="bg-[#090d16] p-4 rounded border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-white uppercase">{gig.title}</h4>
                      <span className="text-emerald-400 font-bold font-mono">{gig.price} {isUsdc ? 'USDC' : 'ETH'}</span>
                    </div>
                    {!gig.escrowReleased ? (
                      <button onClick={() => handleBuyerReleaseGigEscrow(gig.id)} disabled={chainId !== base.id} className="w-full bg-gradient-to-r from-emerald-400 to-cyan-500 text-black font-black py-2 rounded text-[10px] uppercase tracking-widest disabled:opacity-40">
                        RELEASE_VAULT_ESCROW_FUNDS (Process 4% Split)
                      </button>
                    ) : (
                      <p className="text-[10px] text-emerald-500 font-mono font-black">// TRANSACTION MATRIX CLOSED. SETTLEMENT COMPLETE.</p>
                    )}
                  </div>
                )})}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="border border-cyan-950 bg-[#10172a]/90 rounded-xl p-4 flex flex-col gap-3 font-mono shadow-[0_0_25px_rgba(0,240,255,0.03)] sticky top-24">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#00f0ff]" />
                <h3 className="text-xs font-bold tracking-wider text-cyan-400 uppercase">
                  LIQUIDITY RAMPS
                </h3>
              </div>
              <span className="text-[9px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                v2.1
              </span>
            </div>

            <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
              Insufficient liquidity or network gas to broadcast contract listings or settlement bids? Inject Base assets immediately.
            </p>

            <div className="flex flex-col gap-1 mt-1">
              <div className="flex justify-between items-center text-[9px] text-slate-500 px-0.5">
                <span>From: ETH, ARB, OP</span>
                <span className="text-emerald-400 font-bold">Fee: 0.2%</span>
              </div>
              <a 
                href="/portal"
                className="flex items-center justify-center gap-2 border border-cyan-950 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-950/50 hover:border-cyan-500 transition-all py-2 rounded-lg text-xs font-bold tracking-tight duration-200 text-center"
              >
                ⚡ BRIDGE FROM OTHER CHAINS
              </a>
            </div>

            <div className="flex flex-col gap-1 mt-1">
              <div className="flex justify-between items-center text-[9px] text-slate-500 px-0.5">
                <span>From: Card or Bank Account</span>
                <span className="text-cyan-400">Bonus Active</span>
              </div>
              <a 
                href="https://coinbase.com/join/3MUGJEH?src=android-link" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-900/80 hover:border-slate-600 transition-all py-2 rounded-lg text-xs font-bold tracking-tight duration-200 text-center"
              >
                💳 BUY CRYPTO WITH CASH ↗
              </a>
            </div>

            <div className="mt-1 pt-2 border-t border-slate-800/60">
              <p className="text-[9px] font-sans text-slate-500 leading-normal">
                New network registrations utilizing the fiat portal clear eligibility parameters for up to $2,000 in free BTC bonuses once thresholds clear.
              </p>
            </div>
          </div>
        </div>

      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-[#070a12]/95 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-[#10172a] border border-slate-800 rounded-lg p-5 max-w-2xl w-full space-y-4" onClick={e => e.stopPropagation()}>
            <div className="relative bg-[#090d16] rounded p-2 border border-slate-800 flex items-center justify-center min-h-[220px]">
              <img src={selectedItem.images[currentImageIndex]} alt="" className="max-h-[260px] object-contain rounded" />
            </div>
            <div className="flex justify-between items-end font-mono">
              <div>
                <span className="text-[9px] font-black text-cyan-400 uppercase bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-500/30">{selectedItem.category}</span>
                <h2 className="text-lg font-black text-white mt-1.5 uppercase">{selectedItem.title}</h2>
              </div>
              <div className="text-right">
                <p className="text-xl text-emerald-400 font-black">{selectedItem.price} <span className="text-xs font-normal text-zinc-500">{selectedItem.paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase() ? 'USDC' : 'ETH'}</span></p>
                <p className="text-[10px] text-slate-400 font-bold">≈ ${convertToUsd(selectedItem.price, selectedItem.paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase())} USD</p>
              </div>
            </div>
            <p className="text-slate-300 text-[11px] bg-[#090d16] p-3 rounded border border-slate-800 font-mono uppercase">{selectedItem.description}</p>
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <form onSubmit={handlePlaceBid} className="flex gap-1.5">
                <input type="number" step="0.001" required placeholder={`// LOCK BID ESCROW CORNER VALUE > ${selectedItem.price}`} value={bidAmount} onChange={e => setBidAmount(e.target.value)} className="flex-1 bg-[#090d16] border border-slate-800 p-2.5 rounded text-[11px] font-bold text-white font-mono outline-none" />
                <button type="submit" disabled={isProcessing || chainId !== base.id} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black px-4 rounded text-[10px] uppercase disabled:opacity-40">
                  {isProcessing ? 'PROCESSING...' : 'LOCK_ESCROW'}
                </button>
              </form>
              {selectedItem.buyNowPrice && (
                <button onClick={handleBuyNow} disabled={isProcessing || chainId !== base.id} className="w-full bg-gradient-to-r from-emerald-400 to-emerald-500 text-black font-black py-2.5 rounded text-[10px] uppercase disabled:opacity-40">
                  {isProcessing ? 'PROCESSING...' : `SETTLE_IMMEDIATE_BUYOUT (${selectedItem.buyNowPrice} ETH)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
