'use client';

import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense, useRef } from 'react';
import { parseEther, formatEther, parseUnits, formatUnits, createPublicClient, http } from 'viem';
import { base } from 'wagmi/chains';
import { supabase } from '../lib/supabaseClient'; 
import { useAccount, useConnect, useDisconnect, useWriteContract } from 'wagmi';

// ==========================================
// PROTOCOL CONSTANTS & ABIS (V5 LIVE)
// ==========================================
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; 
const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
const NATIVE_ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const VAULT_V5_ADDRESS = "0x19B0a1d53Ff248B60f33e8E017c520B340201C3d"; 
const DB_TABLE = "listings"; // Wired directly to your backend

const ERC20_ABI = [{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];
const ERC721_ABI = [
  {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}
];
const MARKETPLACE_V5_ABI = [
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"buyNow","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"},{"internalType":"uint256","name":"_bidAmount","type":"uint256"}],"name":"placeBid","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_price","type":"uint256"},{"internalType":"address","name":"_paymentToken","type":"address"},{"internalType":"uint8","name":"_assetType","type":"uint8"},{"internalType":"address","name":"_nftContract","type":"address"},{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"uint256","name":"_durationDays","type":"uint256"}],"name":"listAsset","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[],"name":"nextListingId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"listings","outputs":[{"internalType":"address","name":"seller","type":"address"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"address","name":"paymentToken","type":"address"},{"internalType":"uint8","name":"assetType","type":"uint8"},{"internalType":"uint8","name":"status","type":"uint8"},{"internalType":"uint256","name":"auctionEndTime","type":"uint256"},{"internalType":"address","name":"highestBidder","type":"address"},{"internalType":"uint256","name":"highestBid","type":"uint256"},{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bool","name":"fundsReleased","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"markShipped","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"confirmDelivery","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"fileDispute","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"autoReleaseEscrow","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"cancelListing","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"address","name":"_token","type":"address"}],"name":"claimRefund","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"pendingRefunds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];

const PHYSICAL_CATEGORIES = ["Electronics & Hardware", "Collectibles & Cards", "Apparel & Garments", "Automotive Parts", "Home & Living", "Tools & Equipment", "Books & Media", "Sports & Outdoors", "Toys & Hobbies", "Jewelry & Watches"];
const BOUNTY_CATEGORIES = ["Software Development", "Digital Art & Design", "Marketing & Copywriting", "Smart Contract Auditing", "Video Editing", "Translation Services", "Technical Writing", "UI/UX Design", "Cyber Security"];

interface AuctionListing {
  id: string; contract_item_id?: number; type: 'digital' | 'physical' | 'tokenized_nft'; title: string; category: string; description: string; images: string[]; seller: string; highestBidder: string; reservePrice: string; highestBid: string; endTime: number; paymentToken: string; settled: boolean; nftContract?: string; nftTokenId?: string; shippingAddress?: string; trackingInfo?: string; shippingLabelUrl?: string; sellerRating?: number; buyerRating?: number; selectedShippingOption?: string; premiumShipping?: boolean; saleMode?: 'auction' | 'fixed';
}

export default function Home() { return <Suspense fallback={<div className="min-h-screen bg-[#0a0f1d] text-slate-400 p-6 font-mono">// INITIALIZING V5 TERMINAL... //</div>}><MarketplaceContent /></Suspense>; }

function MarketplaceContent() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContractAsync } = useWriteContract();
  // Restored UI Helper Hooks
  const handleClientMessageSubmit = (e: React.FormEvent) => { e.preventDefault(); if(chatInput.trim() && address) { setBountyMessages(p => [...p, { sender: address, text: chatInput, timestamp: Date.now() }]); setChatInput(''); } };
  const executeSandboxCode = () => { setSandboxLogs(['// PROCESSING LOGISTICS COMPILATION...']); setRunSandboxTrig(prev => prev + 1); };
  const handleSaveAddress = async () => { if(selectedItem) { await supabase.from(DB_TABLE).update({ shipping_address: fulfillmentAddress }).eq('id', selectedItem.id); alert("✅ SECURE DESTINATION ROUTED."); if (typeof syncV5Ledger === 'function') syncV5Ledger(); } };
  const handleSaveTracking = async () => {
    if(selectedItem && shippingLabelUrl) {
      try {
        await writeContractAsync({ address: VAULT_V5_ADDRESS as `0x${string}`, abi: MARKETPLACE_V5_ABI, functionName: 'markShipped', args: [BigInt(selectedItem.contract_item_id || 0)] });
        await supabase.from(DB_TABLE).update({ tracking_info: fulfillmentTracking, shipping_label_url: shippingLabelUrl }).eq('id', selectedItem.id);
        alert("✅ TRANSIT BROADCAST LIVE & BLOCKCHAIN UPDATED.");
        if (typeof syncV5Ledger === 'function') syncV5Ledger();
      } catch(e: any) { alert("❌ Web3 Error: " + (e.reason || e.message)); }
    }
  };

  // 🔥 STRIKE 5: ESCROW LIFECYCLE CONTROLS 🔥
  const executeConfirmDelivery = async (id: number) => {
    try {
      await writeContractAsync({ address: VAULT_V5_ADDRESS as `0x${string}`, abi: MARKETPLACE_V5_ABI, functionName: 'confirmDelivery', args: [BigInt(id)] });
      alert("✅ ESCROW RELEASED: Funds have been disbursed to the seller.");
      if (typeof syncV5Ledger === 'function') syncV5Ledger();
    } catch (e: any) { alert("❌ Error: " + (e.reason || e.message)); }
  };

  const executeFileDispute = async (id: number) => {
    try {
      await writeContractAsync({ address: VAULT_V5_ADDRESS as `0x${string}`, abi: MARKETPLACE_V5_ABI, functionName: 'fileDispute', args: [BigInt(id)] });
      alert("⚠️ DISPUTE FILED: Escrow is locked pending admin review.");
      if (typeof syncV5Ledger === 'function') syncV5Ledger();
    } catch (e: any) { alert("❌ Error: " + (e.reason || e.message)); }
  };

  // 🔥 STRIKE 6: THE RECALL (CANCEL LISTING) 🔥
  const executeCancelListing = async (id: number, isUSDC: boolean) => {
    try {
      if (isUSDC) {
        await writeContractAsync({ address: USDC_ADDRESS as `0x${string}`, abi: ERC20_ABI, functionName: 'approve', args: [VAULT_V5_ADDRESS, BigInt(2000000)] });
        await writeContractAsync({ address: VAULT_V5_ADDRESS as `0x${string}`, abi: MARKETPLACE_V5_ABI, functionName: 'cancelListing', args: [BigInt(id)], value: BigInt(0) });
      } else {
        await writeContractAsync({ address: VAULT_V5_ADDRESS as `0x${string}`, abi: MARKETPLACE_V5_ABI, functionName: 'cancelListing', args: [BigInt(id)], value: parseEther("0.002") });
      }
      alert("✅ LISTING CANCELLED: Item removed and fee collected.");
      if (typeof syncV5Ledger === 'function') syncV5Ledger();
    } catch (e: any) { alert("❌ Error: " + (e.reason || e.message)); }
  };

  const handleRateUser = async (stars: number, role: 'seller' | 'buyer') => { 
    if(selectedItem) { 
      await supabase.from(DB_TABLE).update(role === 'seller' ? { seller_rating: stars } : { buyer_rating: stars }).eq('id', selectedItem.id); 
      alert("✅ MATRIX RANKED."); 
      if (typeof syncV5Ledger === 'function') syncV5Ledger();
      setSelectedItem(null); 
    } 
  };

  // V5.2 Restored Purchase Engine
  
  // 🔥 STRIKE 10: THE REFUND VAULT 🔥
  const executeClaimRefund = async (isUSDC: boolean) => {
    try {
      const tokenAddress = isUSDC ? USDC_ADDRESS : ETH_ADDRESS;
      await writeContractAsync({ 
        address: VAULT_V5_ADDRESS as `0x${string}`, 
        abi: MARKETPLACE_V5_ABI, 
        functionName: 'claimRefund', 
        args: [tokenAddress] 
      });
      alert("✅ FUNDS SECURED: Refund successfully pulled to your wallet.");
      if (typeof syncV5Ledger === 'function') syncV5Ledger();
    } catch (e: any) { 
      alert("❌ Claim Error: " + (e.reason || e.message)); 
    }
  };

  const handlePlaceBid = async () => {
    if (!selectedItem) return;
    const finalAmountToUse = selectedItem.saleMode === 'fixed' ? selectedItem.reservePrice : bidInput;
    if (!finalAmountToUse) return alert("Allocation parameter missing.");

    setIsProcessing(true);
    try {
      const isUsdc = selectedItem.paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase();
      const bidWei = isUsdc ? parseUnits(finalAmountToUse, 6) : parseEther(finalAmountToUse);
      
      const publicClient = createPublicClient({ chain: base, transport: http('https://base-rpc.publicnode.com') });
      let txHash;

      if (isUsdc) {
        // Step 1: Approve USDC router
        const approveHash = await writeContractAsync({ address: USDC_ADDRESS as `0x${string}`, abi: ERC20_ABI, functionName: 'approve', args: [VAULT_V5_ADDRESS, bidWei] });
        console.log("Waiting for USDC approval to mine (Hash: " + approveHash + ")...");
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        
        // Step 2: Lock into Matrix Escrow
        txHash = await writeContractAsync({ address: VAULT_V5_ADDRESS as `0x${string}`, abi: MARKETPLACE_V5_ABI, functionName: selectedItem.saleMode === 'fixed' ? 'buyNow' : 'placeBid', args: selectedItem.saleMode === 'fixed' ? [BigInt(selectedItem.contract_item_id || 0)] : [BigInt(selectedItem.contract_item_id || 0), bidWei] });
      } else {
        // Native ETH instant routing
        txHash = await writeContractAsync({ address: VAULT_V5_ADDRESS as `0x${string}`, abi: MARKETPLACE_V5_ABI, functionName: selectedItem.saleMode === 'fixed' ? 'buyNow' : 'placeBid', args: selectedItem.saleMode === 'fixed' ? [BigInt(selectedItem.contract_item_id || 0)] : [BigInt(selectedItem.contract_item_id || 0), bidWei], value: bidWei });
      }
      
      console.log("Transaction signed! Waiting for Base network confirmation... Hash: ", txHash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== 'success') {
        throw new Error("Transaction reverted on the blockchain.");
      }
      console.log("Bid/Purchase confirmed on-chain!");

      if (selectedItem.type === 'physical') {
        await supabase.from(DB_TABLE).update({ selected_shipping_option: chosenShippingTier }).eq('id', selectedItem.id);
      }
      
      alert("✅ TRANSACTION CONFIRMED: Escrow Locked.");
      setSelectedItem(null);
      setBidInput('');
      syncV5Ledger();
    } catch (err: any) { 
      alert(`Rejected: ${err.shortMessage || err.message}`); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  // Restored Cryptographic Verification Hook
  const verifyNftOwnership = async () => {
    setIsVerifyingNft(true);
    try {
      if (!nftContractAddress || !nftTokenId || !address) {
        alert("⚠️ MISSING DATA: Contract Address, Token ID, and Vault Key required.");
        setIsVerifyingNft(false);
        return;
      }
      const publicClient = createPublicClient({ chain: base, transport: http('https://base-rpc.publicnode.com') });
      const owner = await publicClient.readContract({
        address: nftContractAddress as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'ownerOf',
        args: [BigInt(nftTokenId)]
      }) as string;
      
      if (owner.toLowerCase() === address.toLowerCase()) {
        setIsNftVerified(true);
        alert("✅ CRYPTOGRAPHIC VERIFICATION COMPLETE: On-chain ownership confirmed.");
      } else {
        setIsNftVerified(false);
        alert("❌ VERIFICATION FAILED: Your vault key does not hold this asset.");
      }
    } catch(e: any) {
      setIsNftVerified(false);
      alert("❌ ORACLE ERROR: " + (e.reason || e.shortMessage || "Invalid contract or token ID."));
    }
    setIsVerifyingNft(false);
  };

  const [activeTab, setActiveTab] = useState<'browse' | 'list' | 'vault_dashboard' | 'terms'>('browse');
  const [ethPriceUsd, setEthPriceUsd] = useState<number | null>(null);

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await res.json();
        setEthPriceUsd(data.ethereum.usd);
      } catch (e) { console.error("Matrix Price Feed Offline"); }
    };
    fetchEthPrice();
  }, []);
  const [sortOrder, setSortOrder] = useState('newest');
  const [browseSubTab, setBrowseSubTab] = useState<'all' | 'digital' | 'physical' | 'tokenized_nft'>('all');
  
  // Filter & Search Engine State
  const [searchQuery, setSearchQuery] = useState('');
  const [physicalFilter, setPhysicalFilter] = useState('all');
  const [bountyFilter, setBountyFilter] = useState('all');

  const [selectedItem, setSelectedItem] = useState<AuctionListing | null>(null);
  const [modalImgIdx, setModalImgIdx] = useState(0);
  const [ethUsdRate, setEthUsdRate] = useState<number>(3100); 
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State
  const [saleMode, setSaleMode] = useState<'auction' | 'fixed'>('auction');
  const [formType, setFormType] = useState<'digital' | 'physical' | 'tokenized_nft'>('digital');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState(BOUNTY_CATEGORIES[0]);
  const [formReservePrice, setFormReservePrice] = useState(''); 
  const [formDuration, setFormDuration] = useState('86400');
  const [formDescription, setFormDescription] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<'ETH' | 'USDC'>('ETH');
  const [usePremiumShipping, setUsePremiumShipping] = useState(false);
  
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [stockPhotoWarning, setStockPhotoWarning] = useState(false);
  const [nftContractAddress, setNftContractAddress] = useState('');
  const [nftTokenId, setNftTokenId] = useState('');
  const [isNftVerified, setIsNftVerified] = useState(false);
  const [isVerifyingNft, setIsVerifyingNft] = useState(false);

  // Stats & Dashboard
  const [modalTab, setModalTab] = useState<'details' | 'comms' | 'sandbox' | 'fulfillment'>('details');
  const [bidInput, setBidInput] = useState('');
  const [listings, setListings] = useState<AuctionListing[]>([]);
  const [pendingEthRefund, setPendingEthRefund] = useState('0');
  const [pendingUsdcRefund, setPendingUsdcRefund] = useState('0');
  const [mounted, setMounted] = useState(false);

  // LIVE AUCTION TIMER ENGINE
  const [auctionTick, setAuctionTick] = useState(Math.floor(Date.now() / 1000));
  
  useEffect(() => {
    const timer = setInterval(() => setAuctionTick(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeLeft = (endTime: any) => {
    if (!endTime) return '';
    const diff = Number(endTime) - auctionTick;
    if (diff <= 0) return 'CLOSED';
    const d = Math.floor(diff / 86400);
    const h = Math.floor((diff % 86400) / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${d > 0 ? d + 'd ' : ''}${h}h ${m}m ${s}s`;
  };
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  
  // Doom Scroll State
  const [visibleCount, setVisibleCount] = useState(15);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Chat & Sandbox
  const [botMessages, setBotMessages] = useState<{sender: 'bot' | 'user', text: string}[]>([{ sender: 'bot', text: 'BaseVault AI Matrix online. Operational architecture secure.' }]);
  const [chatInput, setChatInput] = useState('');
  const [assistantInput, setAssistantInput] = useState('');
  const [bountyMessages, setBountyMessages] = useState<{sender: string, text: string, timestamp: number}[]>([{ sender: 'system', text: 'Secure Peer-to-Peer Channel Engaged.', timestamp: Date.now() }]);
  const [sandboxCode, setSandboxCode] = useState(`// BaseVault Shipping Telemetry & Escrow Matrix\nfunction calculateFulfillment(basePrice, shippingTier) {\n  const platFee = basePrice * 0.04;\n  let shippingCost = 0;\n  if (shippingTier === 'UPS') shippingCost = 10.00;\n  if (shippingTier === 'FedEx') shippingCost = 20.00;\n  const totalPayout = basePrice * 0.96;\n  return {\n    buyerTotal: basePrice + shippingCost,\n    sellerDisbursed: totalPayout,\n    protocolFeeCollected: platFee\n  };\n}\nconsole.log(calculateFulfillment(150.00, 'FedEx'));`);
  const [sandboxLogs, setSandboxLogs] = useState<string[]>(['// RUNTIME PRE-LOADED WITH ESCROW TELEMETRY ALGORITHM']);
  const [runSandboxTrig, setRunSandboxTrig] = useState(0);

  // Global Configs
  const [chosenShippingTier, setChosenShippingTier] = useState('USPS');
  const [globalDropPoint, setGlobalDropPoint] = useState('');
  const [globalCarrier, setGlobalCarrier] = useState('USPS');

  // Fulfillment Preferences
  const [fulfillmentAddress, setFulfillmentAddress] = useState('');
  const [fulfillmentTracking, setFulfillmentTracking] = useState('');
  const [shippingLabelUrl, setShippingLabelUrl] = useState('');

  // Appraiser
  const [aiAppraisalValue, setAiAppraisalValue] = useState<string | null>(null);
  const [isAppraising, setIsAppraising] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { const timer = setInterval(() => setCurrentTime(Math.floor(Date.now() / 1000)), 1000); return () => clearInterval(timer); }, []);
  
  // Doom Scroll Observer Hook
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        setVisibleCount(prev => prev + 15);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => { if (e.data && e.data.type === 'sandbox-log') setSandboxLogs(prev => [...prev, `> ${e.data.message}`]); };
    window.addEventListener('message', handleMessage); return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (formType === 'digital') { setSaleMode('fixed'); setFormDuration('2592000'); setFormCategory(BOUNTY_CATEGORIES[0]); }
    else if (formType === 'physical') { setFormCategory(PHYSICAL_CATEGORIES[0]); }
    else if (formType === 'tokenized_nft') { setFormCategory('Tokenized Asset'); }
    setUploadedImageUrls([]);
    setStockPhotoWarning(false);
  }, [formType]);

  useEffect(() => {
    if (selectedItem) {
      setModalTab('details');
      setModalImgIdx(0);
      setFulfillmentAddress(selectedItem.shippingAddress || globalDropPoint || '');
      setFulfillmentTracking(selectedItem.trackingInfo || '');
      setShippingLabelUrl(selectedItem.shippingLabelUrl || '');
      setChosenShippingTier(selectedItem.selectedShippingOption || 'USPS');
      setBidInput('');
    }
  }, [selectedItem, globalDropPoint]);

  const uploadToSupabaseStorage = async (file: File): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage.from('listing-assets').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (error) return null;
      const { data: urlData } = supabase.storage.from('listing-assets').getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch (err) { return null; }
  };

  const syncV5Ledger = async () => {
    try {
      const publicClient = createPublicClient({ chain: base, transport: http('https://base-rpc.publicnode.com') });
      const activeListings: AuctionListing[] = [];
      let supabaseMetaMap = new Map();
      try {
        const { data: dbData } = await supabase.from('listings').select('*').limit(1000);
        console.log('🔥 MATRIX X-RAY - SUPABASE RETURNED:', dbData);
        if (dbData) dbData.forEach(i => { supabaseMetaMap.set(Number(i.contract_item_id), i); });
      } catch (e) {}

      let counter = BigInt(0);
      try { counter = await publicClient.readContract({ address: VAULT_V5_ADDRESS as `0x${string}`, abi: MARKETPLACE_V5_ABI, functionName: 'nextListingId' }) as bigint; console.log('🔥 BLOCKCHAIN X-RAY - TOTAL ITEMS:', counter.toString()); } catch(e) { console.error('🔥 BLOCKCHAIN RPC ERROR:', e); return; }

      for (let i = BigInt(1); i <= counter; i++) {
        try {
          const rawAuc = await publicClient.readContract({ address: VAULT_V5_ADDRESS as `0x${string}`, abi: MARKETPLACE_V5_ABI, functionName: 'listings', args: [i] }) as any;
          console.log('🔥 ITEM RAW DATA:', rawAuc);
          if (!rawAuc || rawAuc[0] === ETH_ADDRESS) continue;
          const isUsdc = rawAuc[2].toLowerCase() === USDC_ADDRESS.toLowerCase();
          const meta = supabaseMetaMap.get(Number(i)) || {}; console.log(`🔥 MERGE X-RAY - Blockchain ID: ${i} | DB Match Found:`, !!meta.title);

          activeListings.push({
            id: i.toString(), type: rawAuc[3] === 0 ? 'digital' : rawAuc[3] === 1 ? 'physical' : 'tokenized_nft',
            title: meta.title || `Node #${i}`, category: meta.category || "Asset", description: meta.description || "",
            images: meta.images?.length > 0 ? meta.images : ["https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop"],
            seller: rawAuc[0], highestBidder: rawAuc[6],
            reservePrice: isUsdc ? formatUnits(rawAuc[1], 6) : formatEther(rawAuc[1]),
            highestBid: isUsdc ? formatUnits(rawAuc[7], 6) : formatEther(rawAuc[7]),
            endTime: Number(rawAuc.endTime), paymentToken: rawAuc[2], settled: rawAuc.settled,
            shippingAddress: meta.shipping_address, trackingInfo: meta.tracking_info, shippingLabelUrl: meta.shipping_label_url,
            sellerRating: meta.seller_rating, buyerRating: meta.buyer_rating, selectedShippingOption: meta.selected_shipping_option, premiumShipping: meta.premium_shipping,
            saleMode: meta.sale_mode || (rawAuc[3] === 0 ? 'fixed' : 'auction')
          });
        } catch (err) {}
      }
      setListings(activeListings.sort((a, b) => Number(b.id) - Number(a.id)));
      
      if (address) {
        try {
          const ethRef = await publicClient.readContract({ address: VAULT_V5_ADDRESS as `0x${string}`, abi: MARKETPLACE_V5_ABI, functionName: 'pendingRefunds', args: [address, ETH_ADDRESS] }) as bigint;
          const usdcRef = await publicClient.readContract({ address: VAULT_V5_ADDRESS as `0x${string}`, abi: MARKETPLACE_V5_ABI, functionName: 'pendingRefunds', args: [address, USDC_ADDRESS] }) as bigint;
          setPendingEthRefund(formatEther(ethRef)); setPendingUsdcRefund(formatUnits(usdcRef, 6));
        } catch(e) {}
      }
    } catch (err) {}
  };
  useEffect(() => { syncV5Ledger(); const timer = setInterval(syncV5Ledger, 10000); return () => clearInterval(timer); }, [address]);

  const filteredListings = listings.filter(item => {
    if (browseSubTab !== 'all' && item.type !== browseSubTab) return false;
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(term);
      const matchDesc = item.description?.toLowerCase().includes(term);
      const matchCat = item.category?.toLowerCase().includes(term);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    if (browseSubTab === 'physical' && physicalFilter !== 'all') { if (item.category !== physicalFilter) return false; }
    if (browseSubTab === 'digital' && bountyFilter !== 'all') { if (item.category !== bountyFilter) return false; }
    return true;
  });

  const visiblySlicedListings = filteredListings.slice(0, visibleCount);

  const calculateListingFee = () => {
    const parsedPrice = parseFloat(formReservePrice) || 0;
    const percentageFee = parsedPrice * 0.015;
    return selectedCurrency === 'ETH' 
      ? `${percentageFee.toFixed(5)} ETH` 
      : `\$${percentageFee.toFixed(2)} USDC`;
  };

  const getShippingCost = (tier: string, isUsdc: boolean) => {
    if (tier === 'USPS') return 0;
    let costUsd = tier === 'UPS' ? 10 : 20; 
    return isUsdc ? costUsd : costUsd / ethUsdRate;
  };

  const calculateFinalBreakdown = (item: AuctionListing, chosenTier: string) => {
    const base = parseFloat(item.highestBid !== "0" ? item.highestBid : item.reservePrice) || 0;
    const isUsdc = item.paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase();
    const ticker = isUsdc ? 'USDC' : 'ETH';
    
    const activeTier = item.settled ? (item.selectedShippingOption || 'USPS') : chosenTier;
    const shipping = item.type === 'physical' ? getShippingCost(activeTier, isUsdc) : 0;
    
    const finalTotal = base + shipping;
    const platCut = base * 0.04;
    const sellerDisbursed = base * 0.96;

    return {
      totalBuyerCost: `${finalTotal.toFixed(4)} ${ticker}`,
      sellerPayout: `${sellerDisbursed.toFixed(4)} ${ticker}`,
      protocolFee: `${platCut.toFixed(4)} ${ticker}`,
      shippingComponent: shipping === 0 ? "Included" : `${shipping.toFixed(4)} ${ticker}`
    };
  };

  const getReputation = (targetAddress: string, role: 'seller' | 'buyer') => {
    if (!targetAddress) return "UNRANKED";
    const relevant = listings.filter(l => role === 'seller' ? l.seller.toLowerCase() === targetAddress.toLowerCase() && l.sellerRating : l.highestBidder.toLowerCase() === targetAddress.toLowerCase() && l.buyerRating);
    if (relevant.length === 0) return "UNRANKED";
    return (relevant.reduce((acc, curr) => acc + (role === 'seller' ? (curr.sellerRating || 0) : (curr.buyerRating || 0)), 0) / relevant.length).toFixed(1) + " / 5.0";
  };
  
  const getTimeRemaining = (endTime: number) => {
    const diff = endTime - currentTime;
    if (diff <= 0) return "EXPIRED / SETTLEMENT STANDBY";
    const d = Math.floor(diff / 86400); const h = Math.floor((diff % 86400) / 3600); const m = Math.floor((diff % 3600) / 60); const s = diff % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  const triggerAiAppraisal = () => {
    setIsAppraising(true); setAiAppraisalValue(null);
    setTimeout(() => {
      const baseValue = Math.floor(Math.random() * 400) + 100; 
      setAiAppraisalValue(selectedCurrency === 'ETH' ? (baseValue / ethUsdRate).toFixed(4) : baseValue.toString());
      setIsAppraising(false);
    }, 1200);
  };

  // REAL OPENAI INTEGRATION
  const handleAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!assistantInput.trim()) return;
    
    const text = assistantInput; 
    setBotMessages(p => [...p, { sender: 'user', text }]); 
    setAssistantInput('');
    setBotMessages(p => [...p, { sender: 'bot', text: 'Processing parameters...' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      if (!response.ok) throw new Error('API down');
      const data = await response.json();
      
      setBotMessages(p => {
        const filtered = p.slice(0, -1);
        return [...filtered, { sender: 'bot', text: data.reply }];
      });
    } catch (error) {
      setBotMessages(p => {
        const filtered = p.slice(0, -1);
        return [...filtered, { sender: 'bot', text: "MATRIX ERROR: Secure connection to OpenAI routing failed." }];
      });
    }
  };

  const handleCreateAuction = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!address) return alert("⚠️ Vault Key Required.");
    if (chainId !== base.id) return alert("⚠️ Switch network to Base Mainnet.");
    if (formType === 'tokenized_nft' && !isNftVerified) return alert("⚠️ Oracle verification required for NFTs.");
    
    setIsProcessing(true);
    try {
      const isUsdc = selectedCurrency === 'USDC';
      const parsedPrice = isUsdc ? parseUnits(formReservePrice, 6) : parseEther(formReservePrice);
      const paymentToken = isUsdc ? USDC_ADDRESS : ETH_ADDRESS;
      
      let assetTypeNum = 0;
      if (formType === 'tokenized_nft') assetTypeNum = 1; // 1 = NFT
      if (formType === 'digital') assetTypeNum = 2; // 2 = Bounty
      
      let feeToSend = BigInt(0);
      if (!isUsdc) {
// [REMOVED 0.002 FEE OVERRIDE]
      }
      
      const durationDays = Math.max(1, Math.floor(parseInt(formDuration) / 86400));
      const nftAddress = formType === 'tokenized_nft' ? nftContractAddress : VAULT_V5_ADDRESS;
      const tId = formType === 'tokenized_nft' ? BigInt(nftTokenId || 0) : BigInt(0);

      // Pre-fetch the ID the contract will assign
      const publicClient = createPublicClient({ chain: base, transport: http('https://base-rpc.publicnode.com') });
      const nextId = await publicClient.readContract({
        address: VAULT_V5_ADDRESS as `0x${string}`,
        abi: MARKETPLACE_V5_ABI,
        functionName: 'nextListingId'
      }) as bigint;

      console.log("Transmitting Listing to Base Mainnet (ID: " + nextId + ")...");
      
      const txHash = await writeContractAsync({
        address: VAULT_V5_ADDRESS as `0x${string}`,
        abi: MARKETPLACE_V5_ABI,
        functionName: 'listAsset',
        args: [parsedPrice, paymentToken, assetTypeNum, (assetTypeNum === 1 && nftAddress) ? nftAddress : "0x0000000000000000000000000000000000000000", (assetTypeNum === 1 && tId) ? tId : 0, BigInt(durationDays)],
        value: isUsdc ? BigInt(0) : (parsedPrice * BigInt(15)) / BigInt(1000)
      });

      console.log("Transaction signed by wallet! Hash:", txHash);
      console.log("Waiting for Base network block confirmation...");

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== 'success') {
        throw new Error("Transaction reverted on the blockchain.");
      }

      console.log("Block confirmed! Writing to decentralized matrix...");
      const dbRecord = {
        title: formTitle,
        description: formDescription,
        category: formCategory,
        type: formType,
        reservePrice: formReservePrice,
        paymentToken: paymentToken,
        seller: address,
        highest_bidder: ETH_ADDRESS,
        highest_bid: "0",
        auction_end_time: new Date(Date.now() + parseInt(formDuration) * 1000).toISOString(),
        status: "0",
        images: uploadedImageUrls,
        nftContract: nftContractAddress,
        tokenId: Number(tId),
        contract_item_id: Number(nextId)
      };
      
      await supabase.from(DB_TABLE).insert([dbRecord]);
      alert("✅ Genesis Forge Complete: Asset is officially live on Base Mainnet!");
      
      setActiveTab('browse');
      if (typeof syncV5Ledger === 'function') syncV5Ledger();
    } catch (err: any) { 
      console.error(err);
      alert("❌ Forge Failed: " + (err.shortMessage || err.message)); 
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen p-0 m-0 w-full bg-[#0a0f1d] text-slate-100 font-mono relative">
      <nav className="p-4 md:p-5 border-b border-cyan-500/20 sticky top-0 bg-[#0e1424]/90 backdrop-blur-xl z-40 shadow-lg flex flex-col sm:flex-row justify-between items-center">
        <div><h1 className="text-xl font-black text-white bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">BASEVAULT ENGINE V5</h1></div>
        <div className="flex items-center justify-center sm:justify-end gap-5 text-[10px] md:text-xs font-black uppercase tracking-wider">
          <a href="https://jumper.exchange/?toChain=8453&integrator=basevault" target="_blank" rel="noopener noreferrer" className="text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded bg-[#131b30] hover:bg-emerald-900/50 transition-colors">🌉 BRIDGE</a>
          <button onClick={() => setActiveTab('browse')} className={activeTab === 'browse' ? "text-emerald-400" : "text-slate-400"}>Registry</button>
          <button onClick={() => setActiveTab('list')} className={activeTab === 'list' ? "text-emerald-400" : "text-slate-400"}>Deploy Node</button>
          <button onClick={() => setActiveTab('vault_dashboard')} className={activeTab === 'vault_dashboard' ? "text-emerald-400" : "text-slate-400"}>Telemetry</button>
          <button onClick={() => setActiveTab('terms')} className={activeTab === 'terms' ? "text-rose-400" : "text-slate-400"}>Legal Guard</button>
          {mounted && isConnected ? ( <span className="text-emerald-400 border border-cyan-500/25 px-2 py-1 rounded bg-[#131b30]">{address?.slice(0,6)}...{address?.slice(-4)}</span> ) : ( <button onClick={() => connect({ connector: connectors[0] })} className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">CONNECT</button> )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
        <div className="lg:col-span-3 space-y-6">

          {/* COMPLIANCE LEGAL TERMS TAB - FULLY EXPANDED */}
          {activeTab === 'terms' && (
            <div className="bg-[#10172a] border border-rose-500/30 p-6 rounded-lg space-y-4 shadow-xl">
              <h2 className="text-xl font-black text-rose-400 uppercase tracking-tight flex items-center gap-2">⚠️ COMPLIANCE & LEGAL GUARD</h2>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">By utilizing the BaseVault decentralized infrastructure, you cryptographically agree to our strict Zero-Tolerance Compliance Mandate. BaseVault is a decentralized escrow and telemetry protocol, but we actively monitor and will permanently isolate any node attempting to bypass international or local law.</p>
              <div className="bg-black/50 border border-slate-800 p-4 rounded text-xs space-y-2 text-slate-400 font-mono">
                <p className="text-rose-300 font-bold">ABSOLUTE PROHIBITIONS (PERMANENT BAN & ASSET FREEZE):</p>
                <p>• FIREARMS & MUNITIONS: No guns, rifles, 3D-printed receivers, or ammunition.</p>
                <p>• DRUGS & CONTROLLED SUBSTANCES: No narcotics or illicit chemicals.</p>
                <p>• HUMAN TRAFFICKING & BIOLOGICALS: Absolutely no selling of human materials.</p>
                <p>• ILLICIT GOODS: Anything else that is explicitly illegal.</p>
              </div>
            </div>
          )}

          {/* INDEX BROWSE TAB WITH SEARCH, FILTER MATRIX, AND DOOM SCROLL */}
          {activeTab === 'browse' && (
            <div className="space-y-6">
              {/* ADVANCED FILTER & SEARCH INTERFACE PANEL */}
              <div className="bg-[#10172a] border border-slate-800 p-4 rounded-xl space-y-4 shadow-md">
                <div className="flex flex-col md:flex-row gap-3">
                  {/* REAL-TIME GLOBAL SEARCH INPUT */}
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      name="searchQuery" id="searchQuery" aria-label="Search ledger positions" value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="🔍 Search ledger positions by title, parameter description, or domain..." 
                      className="w-full bg-[#090d16] border border-slate-700 rounded-lg px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2 text-slate-500 hover:text-white text-xs">&times;</button>
                    )}
                  </div>

                  {/* CONTEXTUAL DROPDOWN FILTER ARRAYS */}
                  {browseSubTab === 'physical' && (
                    <div className="w-full md:w-64">
                      <select 
                        value={physicalFilter}
                        onChange={e => setPhysicalFilter(e.target.value)}
                        className="w-full bg-[#090d16] border border-slate-700 rounded-lg p-2 text-xs text-cyan-400 font-black uppercase outline-none focus:border-cyan-400"
                      >
                        <option value="all">⚡ All Physical Clusters</option>
                        {PHYSICAL_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>📦 {cat}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {browseSubTab === 'digital' && (
                    <div className="w-full md:w-64">
                      <select 
                        value={bountyFilter}
                        onChange={e => setBountyFilter(e.target.value)}
                        className="w-full bg-[#090d16] border border-slate-700 rounded-lg p-2 text-xs text-emerald-400 font-black uppercase outline-none focus:border-emerald-400"
                      >
                        <option value="all">⚡ All Bounty Domains</option>
                        {BOUNTY_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>💼 {cat}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* HORIZONTAL REGISTER VIEW TAB LINK CONTROLS */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
                  {(['all', 'digital', 'physical', 'tokenized_nft'] as const).map((tab) => (
                    <button 
                      key={tab} 
                      onClick={() => {
                        setBrowseSubTab(tab);
                        setPhysicalFilter('all');
                        setBountyFilter('all');
                      }} 
                      className={`px-4 py-2 rounded text-[9px] md:text-[10px] font-black uppercase border shrink-0 ${browseSubTab === tab ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-black border-transparent shadow-md' : 'bg-[#11182c] text-slate-400 border-slate-800'}`}
                    >
                      {tab === 'digital' ? 'BOUNTIES' : tab.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* INJECTED MASTER SORT TABS */}
              <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-4 w-full">
                <span className="text-[10px] font-black text-slate-500 uppercase flex items-center mr-2">Sort Matrix:</span>
                {[
                  { id: 'newest', label: 'Newest First' }, 
                  { id: 'oldest', label: 'Oldest First' }, 
                  { id: 'price_high', label: 'Price: High to Low' }, 
                  { id: 'price_low', label: 'Price: Low to High' }
                ].map(sort => (
                  <button
                    key={sort.id}
                    onClick={() => setSortOrder(sort.id)}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase transition-all rounded ${sortOrder === sort.id ? 'bg-cyan-950 text-cyan-400 border border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-black text-slate-400 border border-slate-800 hover:border-cyan-500/50'}`}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
              {/* GRID DISPATCH MATRIX WITH DOOM SCROLL MAPPING */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" ref={scrollRef}>
                {[...visiblySlicedListings].sort((a, b) => {
                  const valA = Number(a.highestBid) > 0 ? Number(a.highestBid) : Number(a.reservePrice);
                  const valB = Number(b.highestBid) > 0 ? Number(b.highestBid) : Number(b.reservePrice);
                  if (sortOrder === 'price_high') return valB - valA;
                  if (sortOrder === 'price_low') return valA - valB;
                  if (sortOrder === 'oldest') return Number(a.id || 0) - Number(b.id || 0);
                  return Number(b.id || 0) - Number(a.id || 0); // newest default
                }).map(item => (
                  <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-[#10172a] border border-slate-800 hover:border-cyan-400 rounded-lg overflow-hidden cursor-pointer flex flex-col justify-between shadow-md transition-all">
                    <div className="relative bg-[#090d16] aspect-video flex items-center justify-center border-b border-slate-800 overflow-hidden">
                      {item.images.length > 0 ? <img src={item.images[0]} className="w-full h-full object-cover opacity-90" /> : <div className="text-cyan-500/30 text-5xl font-black w-full h-full flex items-center justify-center bg-cyan-950/20">{`< / >`}</div>}
                      <span className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded border border-slate-700 text-[9px] font-black text-amber-400 tracking-wider flex items-center gap-1">
                        {item.saleMode === 'fixed' ? '🛒 BUY NOW' : ((item as any).auction_end_time ? (Number((item as any).auction_end_time) > auctionTick ? `⏳ ${formatTimeLeft((item as any).auction_end_time)}` : '🛑 CLOSED') : '🔨 AUCTION')}
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center text-[9px] font-black tracking-wider uppercase mb-1.5 text-slate-500">
                          <span className="truncate pr-2">{item.type === 'digital' ? `💼 ${item.category}` : `📦 ${item.category}`}</span>
                          <span className="text-cyan-400">{item.paymentToken?.toLowerCase() === USDC_ADDRESS.toLowerCase() ? 'USDC' : 'ETH'}</span>
                        </div>
                        <div className="font-black text-sm text-slate-200 truncate uppercase">{item.title}</div>
                        {item.premiumShipping && <div className="text-[8px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-black w-fit mt-1">🚀 PREMIUM SHIPPING ACTIVE</div>}
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-between items-end">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-black">{item.saleMode === 'fixed' ? 'Fixed List Price' : 'Top Bid / Reserve'}</p>
                          <p className="text-emerald-400 text-base font-bold">{Number(item.highestBid) > 0 ? item.highestBid : item.reservePrice} <span className="text-xs font-normal text-slate-500">{item.paymentToken?.toLowerCase() === USDC_ADDRESS.toLowerCase() ? 'USDC' : 'ETH'}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredListings.length === 0 && (
                  <div className="col-span-full py-12 text-center text-xs text-slate-500 uppercase tracking-widest bg-[#10172a] border border-dashed border-slate-800 rounded-lg">
                    // No matching infrastructure records discovered in this layer //
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DEPLOY ASSET TAB */}
          {activeTab === 'list' && (
            <div className="max-w-xl mx-auto w-full space-y-6">
              <div className="border-l-4 border-cyan-400 pl-3"><h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase">Deploy V5 Node</h1></div>
              
              <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300 space-y-1.5">
                <p className="font-black text-white uppercase mb-2">📊 Transparent Protocol Fee Schedule</p>
<p>• <span className="font-bold text-white">Listing Matrix:</span> 1.5% universal listing fee for all assets.</p>
                <p>• <span className="font-bold text-white">Settlement Split:</span> 4% automated protocol takeover / 96% distributed directly to Seller Node.</p>
              </div>

              <form onSubmit={handleCreateAuction} className="bg-[#10172a] border border-slate-800 p-4 md:p-6 rounded-lg space-y-5 shadow-xl">
                
                {/* ASSET TYPE SELECTOR */}
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setFormType('digital')} className={`py-2 rounded font-black uppercase text-[9px] border ${formType === 'digital' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : 'bg-[#090d16] border-slate-800 text-slate-500'}`}>💼 Bounty</button>
                  <button type="button" onClick={() => setFormType('physical')} className={`py-2 rounded font-black uppercase text-[9px] border ${formType === 'physical' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : 'bg-[#090d16] border-slate-800 text-slate-500'}`}>📦 Physical</button>
                  <button type="button" onClick={() => setFormType('tokenized_nft')} className={`py-2 rounded font-black uppercase text-[9px] border ${formType === 'tokenized_nft' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : 'bg-[#090d16] border-slate-800 text-slate-500'}`}>🖼️ NFT Asset</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">System Title<input type="text" required value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full p-2.5 bg-[#090d16] border border-slate-800 rounded text-xs text-white mt-1.5" /></label></div>
                  {formType !== 'tokenized_nft' && (
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Domain Category</label>
                      <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full p-2.5 bg-[#090d16] border border-slate-800 rounded text-xs text-white outline-none">
                        {formType === 'digital' ? (
                          BOUNTY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)
                        ) : (
                          PHYSICAL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)
                        )}
                      </select>
                    </div>
                  )}
                </div>

                {/* SALE MODE TOGGLE */}
                {formType !== 'digital' && (
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Format Architecture</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(formType as string) !== 'digital' && (<button type="button" onClick={() => setSaleMode('auction')} className={`py-2.5 rounded font-black uppercase text-[10px] border transition-all ${saleMode === 'auction' ? 'bg-cyan-950 border-cyan-400 text-cyan-300' : 'bg-[#090d16] border-slate-800 text-slate-500'}`}>🔨 Open Auction</button>)}
                    <button type="button" onClick={() => setSaleMode('fixed')} className={`py-2.5 rounded font-black uppercase text-[10px] border transition-all ${saleMode === 'fixed' ? 'bg-emerald-950 border-emerald-400 text-emerald-300' : 'bg-[#090d16] border-slate-800 text-slate-500'}`}>🛒 Fixed Price / Buy Now</button>
                  </div>
                </div>
                )}

                {formType === 'physical' && (
                  <div className="p-3 bg-[#090d16] border border-cyan-500/20 rounded flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-cyan-400 uppercase">🚀 PREMIUM SHIPPING TOGGLE</p>
                    </div>
                    <input type="checkbox" checked={usePremiumShipping} onChange={e => setUsePremiumShipping(e.target.checked)} className="w-4 h-4 accent-emerald-400 cursor-pointer" />
                  </div>
                )}

                <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Specifications Description<textarea required value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} className="w-full p-2.5 bg-[#090d16] border border-slate-800 rounded text-xs text-white outline-none mt-1.5" /></label></div>

                {formType === 'tokenized_nft' && (
                  <div className="p-3 bg-[#090d16] border border-emerald-500/20 rounded space-y-2">
                     <div className="grid grid-cols-2 gap-2"><input type="text" placeholder="HEX_CONTRACT (0x...)" value={nftContractAddress} onChange={e => setNftContractAddress(e.target.value)} className="p-2 bg-black border border-slate-800 rounded text-[10px] text-white" /><input type="number" placeholder="TOKEN_ID" value={nftTokenId} onChange={e => setNftTokenId(e.target.value)} className="p-2 bg-black border border-slate-800 rounded text-[10px] text-white" /></div>
                     <button type="button" onClick={verifyNftOwnership} className="w-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 py-1.5 rounded text-[10px] font-black uppercase">RUN OWNERSHIP LOGIC</button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">{saleMode === 'fixed' ? 'Fixed List Price' : 'Starting Reserve Value'}<input type="number" step="0.0001" required value={formReservePrice} onChange={e => setFormReservePrice(e.target.value)} className="w-full p-2.5 bg-[#090d16] border border-slate-800 rounded text-xs font-bold text-emerald-400 mt-1.5" /></label></div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Settlement Currency</label>
                    <select value={selectedCurrency} onChange={e => setSelectedCurrency(e.target.value as 'ETH' | 'USDC')} className="w-full p-2.5 bg-[#090d16] border border-slate-800 rounded text-xs text-zinc-200"><option value="ETH">ETH (Native Gas Asset)</option><option value="USDC">USDC (Stable Standard)</option></select>
                  </div>
                </div>

                {saleMode === 'auction' && (
                  <div className="mt-4 mb-2 w-full col-span-full">
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Auction Duration (Time on Market)</label>
                    <select value={formDuration} onChange={(e) => setFormDuration(e.target.value)} className="w-full p-2.5 bg-[#090d16] border border-slate-800 rounded text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer">
                      <option value="86400">1 Day (Rapid)</option>
                      <option value="259200">3 Days (Standard)</option>
                      <option value="604800">7 Days (Extended)</option>
                      <option value="1209600">14 Days (Long)</option>
                      <option value="2592000">30 Days (Maximum)</option>
                    </select>
                  </div>
                )}
                {/* FILE UPLOAD & AI APPRAISER RESTORED FOR BOUNTIES & PHYSICAL */}
                {formType !== 'tokenized_nft' && (
                  <div className="p-3 bg-[#0d1527] border border-slate-800 rounded space-y-3">
                    <label className="block text-[9px] font-black text-slate-400 uppercase">Upload Verification Visuals / References</label>
                    <input type="file" multiple accept="image/*" onChange={async (e) => {
                      if (!e.target.files) return; setUploadingFiles(true);
                      for (const file of Array.from(e.target.files)) {
                        const url = await uploadToSupabaseStorage(file);
                        if (url) {
                          setUploadedImageUrls(p => [...p, url]);
                          if (formType === 'physical' && (file.name.toLowerCase().includes('stock') || file.name.toLowerCase().includes('preview'))) {
                            setStockPhotoWarning(true); triggerAiAppraisal();
                          }
                        }
                      }
                      setUploadingFiles(false);
                    }} className="text-xs file:bg-cyan-950 file:text-cyan-300 file:border-0 file:rounded file:px-4 file:py-1.5 text-slate-400" />
                    
                    {stockPhotoWarning && formType === 'physical' && (
                      <div className="p-2.5 bg-purple-950/40 border border-purple-500/40 text-purple-300 text-[10px] rounded space-y-1">
                        <p className="font-bold">⚠️ STOCK HEURISTIC IDENTIFIED — INITIATING AUTOMATED GLOBAL APPRAISER SCAN</p>
                        <p className="text-[8px] opacity-70 italic">Legal Notice: Appraiser machine logic values are contextual indicators derived via distributed metrics and are not 100% accurate or legally binding guarantees.</p>
                        {isAppraising ? <p className="animate-pulse font-bold mt-1">SCANNING NODE DESCRIPTIONS...</p> : aiAppraisalValue && (
                          <p className="mt-1 font-mono text-white bg-black/40 p-1 rounded inline-block">Estimated Fair Value Index: {aiAppraisalValue} {selectedCurrency}</p>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                      {uploadedImageUrls.map((u, i) => <img key={i} src={u} className="w-12 h-12 rounded object-cover border border-slate-800 shrink-0" />)}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-black/40 border border-cyan-500/20 rounded text-[10px] flex justify-between items-center text-slate-400">
                  <span>PROGRAMMATIC ENTRY FEE:</span>
                  <span className="text-cyan-400 font-bold">{calculateListingFee()}</span>
                </div>

                <button type="submit" disabled={isProcessing} className="w-full bg-gradient-to-r from-emerald-400 to-cyan-500 py-3 rounded font-black text-xs text-black uppercase disabled:opacity-40">LAUNCH SYSTEM ASSET</button>
              </form>
            </div>
          )}

          {/* TELEMETRY DASHBOARD TAB */}
          {activeTab === 'vault_dashboard' && (
            <div className="space-y-6">
              
              {/* LOGISTICS CONFIG */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#090d16] border border-slate-800 rounded-lg p-4">
                  <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4">Logistics Settings</h3>
                  <div className="space-y-2">
                    <textarea value={globalDropPoint} onChange={e => setGlobalDropPoint(e.target.value)} rows={2} placeholder="Configure standard drop address routing..." className="w-full bg-black border border-slate-700 rounded p-2 text-xs text-slate-300 outline-none resize-none" />
                    <select value={globalCarrier} onChange={e => setGlobalCarrier(e.target.value)} className="w-full bg-black border border-slate-700 rounded p-2 text-xs text-slate-300 outline-none"><option value="USPS">USPS Standard</option><option value="UPS">UPS Express Ground</option><option value="FedEx">FedEx Insured</option></select>
                  </div>
                </div>
                <div className="bg-[#090d16] border border-purple-500/20 rounded-lg p-4 flex flex-col justify-center text-center">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-2">Cryptographic Identity Ranking</span>
                  <p className="text-xs text-slate-400">SELLER MATRIX: <span className="text-white font-bold">{getReputation(address || '', 'seller')}</span></p>
                  <p className="text-xs text-slate-400 mt-1">BUYER MATRIX: <span className="text-white font-bold">{getReputation(address || '', 'buyer')}</span></p>
                </div>
              </div>

              {/* DASH LISTS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#090d16] border border-slate-800 rounded-lg p-4 flex flex-col">
                  <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1.5">Deployments</h4>
                  <div className="bg-[#090d16] border border-slate-800 rounded-lg p-4 mt-4">
                    <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Refund Vault</h3>
                    <div className="flex gap-2">
                      <button onClick={() => executeClaimRefund(false)} className="bg-amber-950 px-3 py-1.5 text-[9px] font-black text-amber-400 border border-amber-500/30 rounded uppercase">Claim ETH Refund ({pendingEthRefund})</button>
                      <button onClick={() => executeClaimRefund(true)} className="bg-amber-950 px-3 py-1.5 text-[9px] font-black text-amber-400 border border-amber-500/30 rounded uppercase">Claim USDC Refund ({pendingUsdcRefund})</button>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    {listings.filter(i => i.seller.toLowerCase() === address?.toLowerCase() && !i.settled).length > 0 ? (
                      listings.filter(i => i.seller.toLowerCase() === address?.toLowerCase() && !i.settled).map(node => (
                        <div key={node.id} onClick={() => setSelectedItem(node)} className="p-2.5 bg-[#10172a] border border-slate-800 rounded cursor-pointer flex justify-between items-center"><span className="text-[10px] text-white truncate w-2/3 uppercase">{node.title}</span><span className="text-[10px] text-emerald-400 font-bold">{node.reservePrice}</span></div>
                      ))
                    ) : ( <p className="text-[9px] text-slate-600 uppercase py-4 text-center">// SYSTEM STANDBY //</p> )}
                  </div>
                </div>
                <div className="bg-[#090d16] border border-slate-800 rounded-lg p-4 flex flex-col">
                  <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1.5">Engagements</h4>
                  <div className="space-y-2 flex-1">
                    {listings.filter(i => i.highestBidder?.toLowerCase() === address?.toLowerCase() && !i.settled).length > 0 ? (
                      listings.filter(i => i.highestBidder?.toLowerCase() === address?.toLowerCase() && !i.settled).map(node => (
                        <div key={node.id} onClick={() => setSelectedItem(node)} className="p-2.5 bg-[#10172a] border border-slate-800 rounded cursor-pointer flex justify-between items-center"><span className="text-[10px] text-white truncate w-2/3 uppercase">{node.title}</span><span className="text-[10px] text-emerald-400 font-bold">{node.highestBid}</span></div>
                      ))
                    ) : ( <p className="text-[9px] text-slate-600 uppercase py-4 text-center">// SYSTEM STANDBY //</p> )}
                  </div>
                </div>
                <div className="bg-[#090d16] border border-slate-800 rounded-lg p-4 flex flex-col">
                  <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1.5">Settled Ledger</h4>
                  <div className="space-y-2 flex-1">
                    {listings.filter(i => i.settled && (i.seller.toLowerCase() === address?.toLowerCase() || i.highestBidder?.toLowerCase() === address?.toLowerCase())).length > 0 ? (
                      listings.filter(i => i.settled && (i.seller.toLowerCase() === address?.toLowerCase() || i.highestBidder?.toLowerCase() === address?.toLowerCase())).map(node => (
                        <div key={node.id} onClick={() => setSelectedItem(node)} className="p-2.5 bg-[#10172a] border border-slate-800 rounded cursor-pointer flex justify-between items-center"><span className="text-[10px] text-white truncate w-2/3 uppercase">{node.title}</span><span className="text-[10px] text-slate-400 font-bold">COMPLETED</span></div>
                      ))
                    ) : ( <p className="text-[9px] text-slate-600 uppercase py-4 text-center">// SYSTEM STANDBY //</p> )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR TOOLS */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* AI ASSIST LOGIC RESTORED & WIRED */}
          <div className="bg-[#0b1224] border border-cyan-500/30 rounded-xl p-4 flex flex-col h-72">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              BaseVault AI Assistant
            </span>
            <div className="flex-1 overflow-y-auto space-y-2 p-1 border border-slate-800/80 bg-black/40 rounded text-[10px] no-scrollbar">
              {botMessages.map((msg, idx) => (
                <div key={idx} className={`p-1.5 rounded ${msg.sender === 'bot' ? 'bg-cyan-950/40 text-cyan-200 border-l border-cyan-400' : 'bg-slate-900 text-slate-300 text-right ml-4'}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleAssistantSubmit} className="mt-2 flex gap-1">
              <input type="text" name="assistantInput" id="assistantInput" aria-label="Query framework state" value={assistantInput} onChange={e => setAssistantInput(e.target.value)} placeholder="Query framework state..." className="flex-1 bg-black border border-slate-700 rounded px-2 py-1 text-[10px] text-white outline-none" />
              <button type="submit" className="bg-cyan-900 hover:bg-cyan-800 px-2 py-1 text-[9px] font-black uppercase rounded">ASK</button>
            </form>
          </div>

          <div className="bg-gradient-to-b from-[#0052FF]/20 to-[#090d16] border border-[#0052FF]/40 rounded-xl p-4 text-center">
            <h3 className="text-[10px] font-black tracking-widest text-[#0052FF] uppercase mb-1">Coinbase Fiat Link</h3>
            <a href="https://coinbase.com/partner/basevault" target="_blank" rel="noopener noreferrer" className="block w-full bg-[#0052FF] hover:bg-[#0052FF]/80 text-white font-black py-2 rounded text-[10px] uppercase transition-colors mt-3">Buy Asset Capital</a>
          </div>
        </div>
      </div>

      {/* DETAILED NODE INSPECTION MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0e1424] border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-[#0e1424] border-b border-slate-800 p-4 flex justify-between items-center z-10">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{selectedItem.type === 'digital' ? '💼 BOUNTY WORKSTATION' : `ASSET NODE #${selectedItem.id}`}</span>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white font-black text-2xl leading-none">&times;</button>
            </div>
            
            <div className="flex border-b border-slate-800 bg-[#090d16] overflow-x-auto no-scrollbar">
              <button onClick={() => setModalTab('details')} className={`shrink-0 px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${modalTab === 'details' ? 'text-emerald-400 border-emerald-400 bg-emerald-950/20' : 'text-slate-500 border-transparent'}`}>Overview</button>
              <button onClick={() => setModalTab('comms')} className={`shrink-0 px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${modalTab === 'comms' ? 'text-emerald-400 border-emerald-400 bg-emerald-950/20' : 'text-slate-500 border-transparent'}`}>Comms</button>
              {selectedItem.type === 'digital' && <button onClick={() => setModalTab('sandbox')} className={`shrink-0 px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${modalTab === 'sandbox' ? 'text-emerald-400 border-emerald-400 bg-emerald-950/20' : 'text-slate-500 border-transparent'}`}>Runtime sandbox</button>}
              {selectedItem.type === 'physical' && selectedItem.settled && (
                <button onClick={() => setModalTab('fulfillment')} className={`shrink-0 px-4 py-3 text-[10px] font-black uppercase border-b-2 ${modalTab === 'fulfillment' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent'}`}>Fulfillment</button>
              )}
            </div>

            <div className="p-6 space-y-4">
              {modalTab === 'details' && (
                <>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* IMAGE CAROUSEL LOGIC RESTORED FOR BOTH BOUNTY AND PHYSICAL */}
                    {selectedItem.type !== 'tokenized_nft' && selectedItem.images.length > 0 && (
                      <div className="w-full sm:w-1/3 flex flex-col gap-2">
                        <div className="bg-[#090d16] rounded border border-slate-800 aspect-square overflow-hidden">
                          <img src={selectedItem.images[modalImgIdx] || selectedItem.images[0]} className="w-full h-full object-cover" />
                        </div>
                        {selectedItem.images.length > 1 && (
                          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {selectedItem.images.map((img, idx) => (
                              <img key={idx} src={img} onClick={() => setModalImgIdx(idx)} className={`w-12 h-12 rounded cursor-pointer object-cover border transition-all shrink-0 ${modalImgIdx === idx ? 'border-cyan-400' : 'border-slate-800 opacity-50 hover:opacity-100'}`} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className={selectedItem.type !== 'tokenized_nft' && selectedItem.images.length > 0 ? "w-full sm:w-2/3 flex flex-col" : "w-full flex flex-col"}>
                      <h2 className="text-lg font-black text-white uppercase">{selectedItem.title}</h2>
                      <p className="text-[10px] text-slate-400 mt-1">DEPLOYER: {selectedItem.seller} [RANK: {getReputation(selectedItem.seller, 'seller')}]</p>
                      <div className="mt-3 bg-black border border-slate-800 rounded p-3 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                        {selectedItem.description || "// No detailed operational parameters supplied."}
                      </div>
                    </div>
                  </div>

                  {/* BUYER SHIPPING MATRIX */}
                  {selectedItem.type === 'physical' && !selectedItem.settled && selectedItem.seller.toLowerCase() !== address?.toLowerCase() && (
                    <div className="p-3.5 bg-[#0b1426] border border-cyan-500/20 rounded-lg space-y-2">
                      <p className="text-[9px] font-black text-cyan-400 uppercase tracking-wider">📦 ASSIGN SHIPPING MATRIX ROUTE (BUYER MANDATED)</p>
                      <select value={chosenShippingTier} onChange={(e) => setChosenShippingTier(e.target.value)} className="w-full bg-black border border-slate-700 p-2 text-xs text-white outline-none">
                        <option value="USPS">USPS Standard (Included - No Additional Fee)</option>
                        <option value="UPS">UPS Express Ground ($10.00 USDC / ETH eq.)</option>
                        <option value="FedEx">FedEx Insured ($20.00 USDC / ETH eq.)</option>
                      </select>
                    </div>
                  )}

                  {/* FINANCIAL BREAKDOWN */}
                  <div className="p-4 bg-[#090d16] border border-emerald-500/20 rounded-lg space-y-2">
                    <p className="text-[9px] font-black text-emerald-400 tracking-wider uppercase">// ESCROW ACCOUNTABILITY ENGINE BREAKDOWN //</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-slate-400">
                      <span>Total Buyer Cost:</span><span className="text-white font-bold text-right">{calculateFinalBreakdown(selectedItem, chosenShippingTier).totalBuyerCost}</span>
                      <span>Disbursed to Seller (96%):</span><span className="text-emerald-400 font-bold text-right">{calculateFinalBreakdown(selectedItem, chosenShippingTier).sellerPayout}</span>
                      <span>Protocol Takeover Split (4%):</span><span className="text-cyan-400 font-bold text-right">{calculateFinalBreakdown(selectedItem, chosenShippingTier).protocolFee}</span>
                      {selectedItem.type === 'physical' && (
                        <><span>Calculated Carrier Cost:</span><span className="text-amber-400 text-right">{calculateFinalBreakdown(selectedItem, chosenShippingTier).shippingComponent}</span></>
                      )}
                    </div>
                  </div>

                  {/* DYNAMIC AUCTION/BUY NOW CHECKOUT BAR */}
                  {!selectedItem.settled && (
                    <div className="pt-4 border-t border-slate-800 flex justify-between items-center gap-4">
                      {selectedItem.saleMode === 'auction' && Number(selectedItem.highestBid) > 0 && (
                          <div className="w-full text-[10px] text-amber-400 font-black mb-2 text-right tracking-wider">
                            TOP BIDDER REPUTATION: ⭐ {(selectedItem as any).buyer_rating ? Number((selectedItem as any).buyer_rating).toFixed(1) : 'NEW'}
                          </div>
                        )}
                        {selectedItem.saleMode !== 'fixed' && (
                        <input type="number" step="0.0001" placeholder="Bid Amount..." value={bidInput} onChange={e => setBidInput(e.target.value)} className="w-32 bg-black border border-slate-700 rounded px-3 py-2 text-emerald-400 text-xs outline-none" />
                      )}
                      {selectedItem.saleMode !== 'fixed' && Number(selectedItem.auctionEndTime) > 0 && Math.floor(Date.now() / 1000) > Number(selectedItem.auctionEndTime) ? (
                            <button disabled className="flex-1 bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed px-6 py-3 rounded text-[11px] font-black uppercase tracking-wider text-center">
                              🔒 AUCTION ENDED
                            </button>
                          ) : (
                            <button onClick={handlePlaceBid} className="flex-1 bg-emerald-500 hover:bg-emerald-400 transition-colors text-black px-6 py-3 rounded text-[11px] font-black uppercase tracking-wider text-center">
                        {selectedItem.saleMode === 'fixed' 
                          ? `🛒 BUY NOW FOR ${selectedItem.reservePrice} ${selectedItem.paymentToken?.toLowerCase() === USDC_ADDRESS.toLowerCase() ? 'USDC' : 'ETH'}` 
                          : (selectedItem.type === 'digital' ? 'SECURE BOUNTY PIPELINE' : 'TRANSMIT BID')}
                      </button>
                          )}
                    </div>
                  )}

                  {selectedItem.settled && (
                    <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded flex justify-between items-center text-xs">
                      <span>Rank counterparty interaction index:</span>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(star => ( <button key={star} onClick={() => handleRateUser(star, 'seller')} className="text-purple-400 font-bold">★</button> ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {modalTab === 'comms' && (
                <div className="h-64 flex flex-col border border-slate-800 rounded bg-black">
                  <div className="flex-1 p-3 overflow-y-auto space-y-2 text-[11px] font-sans">
                    {bountyMessages.map((msg, i) => ( <div key={i} className={`p-2 rounded max-w-[80%] ${msg.sender === address ? 'bg-cyan-950 text-cyan-200 ml-auto' : 'bg-slate-900 text-slate-300 mr-auto'}`}>{msg.text}</div> ))}
                  </div>
                  <form onSubmit={handleClientMessageSubmit} className="p-2 border-t border-slate-800 flex gap-2"><input type="text" name="chatInput" id="chatInput" aria-label="Chat input" value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-[#10172a] border border-slate-800 rounded px-2 text-xs text-white outline-none" /><button type="submit" className="bg-cyan-900 px-3 text-[10px] font-black uppercase">SEND</button></form>
                </div>
              )}

              {modalTab === 'sandbox' && (
                <div className="space-y-3">
                  <textarea value={sandboxCode} onChange={e => setSandboxCode(e.target.value)} className="w-full h-40 bg-black p-3 font-mono text-xs text-amber-300 border border-slate-800 outline-none resize-none" />
                  <button onClick={executeSandboxCode} className="bg-emerald-600 text-black font-black px-4 py-1.5 rounded text-[10px] uppercase">RUN TELEMETRY TEST</button>
                  <div className="bg-slate-950 border border-slate-800 p-2 rounded h-24 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-0.5">
                    {sandboxLogs.map((l, i) => <div key={i}>{l}</div>)}
                  </div>
                  <iframe key={runSandboxTrig} style={{ display: 'none' }} sandbox="allow-scripts" srcDoc={`<script>console.log = function(...args) { window.parent.postMessage({ type: 'sandbox-log', message: args.join(' ') }, '*'); }; try { ${sandboxCode} } catch(e) { console.log('ERROR: ' + e.message); }</script>`} />
                </div>
              )}

              {modalTab === 'fulfillment' && (
                <div className="space-y-4">
                  <div className="bg-black border border-slate-800 p-3 rounded">
                    <h4 className="text-[10px] text-cyan-400 font-black uppercase mb-1">Target Address Assignment</h4>
                    <textarea value={fulfillmentAddress} onChange={e => setFulfillmentAddress(e.target.value)} rows={2} className="w-full bg-transparent text-xs text-white outline-none" />
                    <button onClick={handleSaveAddress} className="mt-2 bg-cyan-950 px-3 py-1 text-[9px] font-black text-cyan-400 border border-cyan-500/30 rounded uppercase">Lock Route</button>
                  </div>
                  <div className="bg-black border border-slate-800 p-3 rounded">
                    <h4 className="text-[10px] text-emerald-400 font-black uppercase mb-2">Transit Manifest Submission</h4>
                    <input type="text" name="fulfillmentTracking" id="fulfillmentTracking" aria-label="Tracking Identifier" value={fulfillmentTracking} onChange={e => setFulfillmentTracking(e.target.value)} placeholder="Tracking Identifier..." className="w-full bg-[#10172a] border border-slate-700 rounded p-2 text-xs text-white outline-none" />
                    <button onClick={handleSaveTracking} className="mt-2 bg-emerald-950 px-3 py-1 text-[9px] font-black text-emerald-400 border border-emerald-500/30 rounded uppercase">Transmit Manifest</button>
                    <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
                      <button onClick={() => executeConfirmDelivery(Number(selectedItem.contract_item_id || 0))} className="bg-emerald-950 px-3 py-1 text-[9px] font-black text-emerald-400 border border-emerald-500/30 rounded uppercase">Confirm Delivery</button>
                      <button onClick={() => executeFileDispute(Number(selectedItem.contract_item_id || 0))} className="bg-rose-950 px-3 py-1 text-[9px] font-black text-rose-400 border border-rose-500/30 rounded uppercase">File Dispute</button>
                      <button onClick={() => executeCancelListing(Number(selectedItem.contract_item_id || 0), selectedItem.paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase())} className="bg-slate-900 px-3 py-1 text-[9px] font-black text-slate-400 border border-slate-600 rounded uppercase">Cancel Listing</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
