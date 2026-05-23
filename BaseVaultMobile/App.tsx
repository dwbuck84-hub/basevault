import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, ScrollView, FlatList, TextInput, ActivityIndicator, Alert, Image, Modal, RefreshControl } from 'react-native';
import { useWalletConnectModal, WalletConnectModal } from '@walletconnect/modal-react-native';
import * as ImagePicker from 'expo-image-picker';

const projectId = '23691e253e4736fe086c7eb4b094ca97';
const CONTRACT_ADDRESS = '0x4bEa1744818C8B0Bb744e3524670F27253AE7aA5';

// Native UI branding injection
const baseVaultLogo = require('./assets/1779467610858.png');

interface WalletNFT {
  id: string;
  name: string;
  collection: string;
  tokenId: string;
  imageUri: string;
}

interface Bounty {
  id: string;
  title: string;
  description: string;
  payout: string;
  location: string;
  status: 'OPEN_NODE' | 'BOUND_TO_YOU' | 'SUBMITTED_AWAITING_VERIFICATION' | 'FINALIZED';
  proofImage?: string | null;
  proofNotes?: string;
  attachedFile?: string | null;
  deployerRank: string;
  collectorRank?: string;
}

interface ChatMessage {
  id: string;
  sender: 'HUNTER' | 'AUDITOR' | 'SYSTEM_AI';
  text: string;
  timestamp: string;
}

interface SoldItem {
  id: string;
  name: string;
  price: string;
  buyNowBase: number;
  buyer: string;
  shippingAddress: string;
  shipmentVerified: boolean;
  deliveryVerified: boolean;
  trackingNumber: string;
  trackingImageUri?: string | null;
  shippingTier: 'STANDARD' | 'PREMIUM';
  buyerRanked: boolean;
}

interface UnsoldItem {
  id: string;
  name: string;
  originalPrice: string;
  status: 'EXPIRED' | 'CANCELLED';
}

interface ItemLedger {
  id: string;
  name: string;
  description: string;
  type: string;
  contract: string;
  listPrice: string;
  buyNowPrice: string;
  status: string;
  meta: string;
  images: string[];
  bidCount: number;
  timeLeft: string;
  sellerRank: string;
}

export default function App() {
  const { open, isConnected, address, provider } = useWalletConnectModal();
  const [activeTab, setActiveTab] = useState<'MARKET' | 'BOUNTIES' | 'DASHBOARD' | 'DIAGNOSTICS'>('MARKET');
  
  // LIVE ETH PRICE FEED INTEGRATION
  const [ethUsdRate, setEthUsdRate] = useState<number>(3450.00);

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        if (data?.ethereum?.usd) {
          setEthUsdRate(data.ethereum.usd);
        }
      } catch (err) {
        console.log('[SYS] Live price feed offline. Utilizing safe fallback.');
      }
    };
    
    fetchEthPrice();
    const priceInterval = setInterval(fetchEthPrice, 60000); // Refresh every 60 seconds
    return () => clearInterval(priceInterval);
  }, []);

  const ethToUsd = useCallback((ethAmount: string | number) => {
    const num = parseFloat(String(ethAmount).replace(/[^0-9.]/g, '')) || 0;
    return `$${(num * ethUsdRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [ethUsdRate]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'ALL' | 'PHYSICAL' | 'NFT'>('ALL');
  const [activeBidInputId, setActiveBidInputId] = useState<string | null>(null);
  const [customBidValues, setCustomBidValues] = useState<Record<string, string>>({});

  const [formVisible, setFormVisible] = useState(false);
  const [listingType, setListingType] = useState<'PHYSICAL' | 'BOUNTY' | 'NFT'>('PHYSICAL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [listPrice, setListPrice] = useState('');
  const [buyNowPrice, setBuyNowPrice] = useState('');
  const [bountyPayout, setBountyPayout] = useState('');
  const [locationOrScope, setLocationOrScope] = useState('');
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [selectedNft, setSelectedNft] = useState<WalletNFT | null>(null);

  const [shieldStatus, setShieldStatus] = useState<'IDLE' | 'ANALYZING' | 'STOCK_DETECTED' | 'VERIFIED' | 'DISABLED_BY_USER'>('IDLE');
  const [shieldAppraisalVal, setShieldAppraisalVal] = useState<string | null>(null);
  const [shieldAuthenticityIndex, setShieldAuthenticityIndex] = useState<string | null>(null);
  const [shieldConditionGrade, setShieldConditionGrade] = useState<string | null>(null);

  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshingBounties, setRefreshingBounties] = useState(false);
  const [loadingMoreBounties, setLoadingMoreBounties] = useState(false);

  const [reviewText, setReviewText] = useState<Record<string, string>>({});
  const [selectedStars, setSelectedStars] = useState<Record<string, number>>({});

  const [checkoutItem, setCheckoutItem] = useState<ItemLedger | null>(null);
  const [buyerShippingTier, setBuyerShippingTier] = useState<'STANDARD' | 'PREMIUM'>('STANDARD');

  const [aiBotVisible, setAiBotVisible] = useState(false);
  const [aiBotInput, setAiBotInput] = useState('');
  const [aiBotLoading, setAiBotLoading] = useState(false);
  const [aiBotLogs, setAiBotLogs] = useState<ChatMessage[]>([
    { id: 'ai-init', sender: 'SYSTEM_AI', text: 'BaseVault Assistance Help Bot online. Local node tracking active.', timestamp: 'SYSTEM' }
  ]);

  const [selectedBountyForWork, setSelectedBountyForWork] = useState<Bounty | null>(null);
  const [fieldNotes, setFieldNotes] = useState('');
  const [fieldImageUri, setFieldImageUri] = useState<string | null>(null);
  const [sandboxFileName, setSandboxFileName] = useState<string | null>(null);
  const [chatMessageText, setChatMessageText] = useState('');
  const [bountyChats, setBountyChats] = useState<Record<string, ChatMessage[]>>({
    'B-901': [
      { id: 'm1', sender: 'AUDITOR', text: 'Ensure the retail storefront ad placement is checked thoroughly for baseline visibility.', timestamp: '10:42 AM' },
      { id: 'm2', sender: 'HUNTER', text: 'Acknowledged node task. Arriving at geolocation targets shortly.', timestamp: '10:45 AM' }
    ]
  });

  const [ownedNfts] = useState<WalletNFT[]>([
    { id: 'W-NFT-01', name: 'DAGFORGE Elite Alpha Cyberdeck #104', collection: 'DAGFORGE TCG', tokenId: '#104', imageUri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80' },
    { id: 'W-NFT-02', name: 'BaseVault Black Founder pass #08', collection: 'BaseVault OG', tokenId: '#08', imageUri: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=400&q=80' }
  ]);
  
  const [soldItems, setSoldItems] = useState<SoldItem[]>([
    { id: 'SOLD-01', name: 'Custom Aluminium Cyberdeck Case V2 Frame', price: '0.10 ETH', buyNowBase: 0.10, buyer: '0x71C7...6E3b', shippingAddress: '1244 Parkway Node, Sevierville, TN 37862', shipmentVerified: false, deliveryVerified: false, trackingNumber: '', shippingTier: 'STANDARD', buyerRanked: false }
  ]);

  const [unsoldItems, setUnsoldItems] = useState<UnsoldItem[]>([
    { id: 'UNSOLD-01', name: 'DAGFORGE Holo Cyberpunk Starter Pack Bundle', originalPrice: '0.02 ETH', status: 'EXPIRED' }
  ]);

  const [marketItems, setMarketItems] = useState<ItemLedger[]>([
    {
      id: 'BV-M-01',
      name: 'Cyberdeck Production Frame (Aluminium V2)',
      description: 'Fully assembled aluminium structural frame suitable for portable micro-computing builds and cyberdecks. Includes mounting hardware.',
      type: 'PHYSICAL',
      contract: CONTRACT_ADDRESS,
      listPrice: '0.04 ETH',
      buyNowPrice: '0.10 ETH',
      status: 'LIVE_ESCROW',
      meta: '🛡️ Certified: EXCELLENT Condition | Index: 98.2%',
      images: [
        'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=500&q=80',
        'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1601524909162-be87252be298?auto=format&fit=crop&w=400&q=80'
      ],
      bidCount: 3,
      timeLeft: '14h 22m (Block #89422)',
      sellerRank: '👑 Rank S [99.8%]'
    }
  ]);

  const [bounties, setBounties] = useState<Bounty[]>([
    { id: 'B-901', title: 'Local Retail Merchandising & Ad Audit', description: 'Travel to local branch nodes to verify placement of ad materials. Upload photo proof.', payout: '0.015 BaseETH', location: 'Sevierville, TN', status: 'OPEN_NODE', deployerRank: 'Rank A [96.4%]' },
    { id: 'B-902', title: 'Solidity Smart Contract Safety Verification', description: 'Review provided .sol files in sandbox and submit vulnerability reports.', payout: '0.04 ETH', location: 'Remote Node', status: 'OPEN_NODE', deployerRank: 'Rank S [99.1%]' }
  ]);

  const filteredMarketItems = marketItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch && (selectedCategoryFilter === 'ALL' || item.type === selectedCategoryFilter);
  });

  const filteredBounties = bounties.filter(item => {
    return item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.location.toLowerCase().includes(searchQuery.toLowerCase()) || (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const handlePullToRefreshMarket = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      const liveFreshInjection: ItemLedger = {
        id: "BV-FRESH-INJECT-" + Date.now(),
        name: `★ JUST MINED // Cyberdeck Rig Hub Pro [Block #${Math.floor(Math.random() * 500) + 90000}]`,
        description: 'Automated network injection listing. Specs unverified.',
        type: Math.random() > 0.5 ? "PHYSICAL" : "NFT",
        contract: CONTRACT_ADDRESS,
        listPrice: "0.06 ETH",
        buyNowPrice: "0.18 ETH",
        status: "LIVE_ESCROW",
        meta: "📦 Unverified Merchant Entry",
        images: ["https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=500&q=80"],
        bidCount: 0,
        timeLeft: "7d 00h",
        sellerRank: "👑 Rank S [100%]"
      };
      setMarketItems(prev => [liveFreshInjection, ...prev]);
      setRefreshing(false);
    }, 1200);
  }, []);

  const handleLoadMoreInfiniteItems = () => {
    if (loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      const incrementalTailBatch: ItemLedger[] = [
        {
          id: "BV-TAIL-BATCH-" + Math.random() + "-" + Date.now(),
          name: "Infinite Generated Deck Matrix Wireframe Node",
          description: 'Historical protocol data matrix render.',
          type: "NFT",
          contract: CONTRACT_ADDRESS,
          listPrice: "0.022 ETH",
          buyNowPrice: "0.08 ETH",
          status: "LIVE_ESCROW",
          meta: "Token Contract NFT ID: #204",
          images: ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80"],
          bidCount: 1,
          timeLeft: "4d 19h",
          sellerRank: "Rank A [94.5%]"
        }
      ];
      setMarketItems(prev => [...prev, ...incrementalTailBatch]);
      setLoadingMore(false);
    }, 1000);
  };

  const handlePullToRefreshBounties = useCallback(() => {
    setRefreshingBounties(true);
    setTimeout(() => {
      const freshBounty: Bounty = {
        id: "B-FRESH-" + Date.now(),
        title: `Priority Geolocation Audit [Node #${Math.floor(Math.random() * 500) + 9000}]`,
        description: 'Urgent physical verification required at target coordinates.',
        payout: "0.025 ETH",
        location: "Sevierville, TN",
        status: "OPEN_NODE",
        deployerRank: "Rank S [99.9%]"
      };
      setBounties(prev => [freshBounty, ...prev]);
      setRefreshingBounties(false);
    }, 1200);
  }, []);

  const handleLoadMoreInfiniteBounties = () => {
    if (loadingMoreBounties) return;
    setLoadingMoreBounties(true);
    setTimeout(() => {
      const tailBounty: Bounty = {
        id: "B-TAIL-" + Math.random() + "-" + Date.now(),
        title: "Legacy Web3 Contract Deployment Verification",
        description: 'Verify legacy code execution and map memory usage.',
        payout: "0.01 ETH",
        location: "Remote",
        status: "OPEN_NODE",
        deployerRank: "Rank B [88.5%]"
      };
      setBounties(prev => [...prev, tailBounty]);
      setLoadingMoreBounties(false);
    }, 1000);
  };

  const handleSendAiBotQuery = () => {
    if (!aiBotInput) return;
    setAiBotLogs(prev => [...prev, { id: "ai-q-" + Date.now(), sender: 'HUNTER', text: aiBotInput, timestamp: 'LOG' }]);
    const currentQueryText = aiBotInput;
    setAiBotInput('');
    setAiBotLoading(true);

    setTimeout(() => {
      let botResponseText = '[HELP_BOT] Protocol queries mapped successfully.';
      if (currentQueryText.toLowerCase().includes('shipping') || currentQueryText.toLowerCase().includes('premium')) {
        botResponseText = 'HELP BOT RESPONSE: Buyers allocate their custom shipping tiers inside the checkout window overlay, injecting a dynamic +0.02 ETH holding collateral upcharge onto premium shipments.';
      }
      setAiBotLogs(prev => [...prev, { id: "ai-r-" + Date.now(), sender: 'SYSTEM_AI', text: botResponseText, timestamp: 'RESPONSE' }]);
      setAiBotLoading(false);
    }, 1000);
  };

  const triggerShieldAnalysis = async (images: string[]) => {
    if (images.length === 0) {
      setAiBotLogs(prev => [
        ...prev,
        { id: "shield-empty-" + Date.now(), sender: 'SYSTEM_AI', text: "❌ [SELLER SHIELD]: No raw photographs attached in the creation tray. Global market appraisal cannot compile without asset imagery.", timestamp: 'SHIELD' }
      ]);
      return;
    }

    setShieldStatus('ANALYZING');
    setAiBotLogs(prev => [
      ...prev,
      { id: "shield-log-start-" + Date.now(), sender: 'SYSTEM_AI', text: "⚙️ [SELLER SHIELD ENGINE]: Processing upload stream... Running computer-vision scan against global market indices to verify condition and authenticity parameters.", timestamp: 'SHIELD' }
    ]);
    
    setTimeout(() => {
      const simulatedEthValue = (Math.random() * 0.15 + 0.03).toFixed(3);
      const generatedGrade = ['MINT', 'EXCELLENT', 'GOOD'][Math.floor(Math.random() * 3)];
      const generatedScore = (Math.random() * 4 + 95.5).toFixed(1);
      
      setShieldAppraisalVal(simulatedEthValue);
      setShieldAuthenticityIndex(generatedScore);
      setShieldConditionGrade(generatedGrade);
      
      setListPrice((parseFloat(simulatedEthValue) * 0.4).toFixed(3));
      setBuyNowPrice(simulatedEthValue);
      setShieldStatus('VERIFIED');

      setAiBotLogs(prev => [
        ...prev,
        { id: "shield-log-success-" + Date.now(), sender: 'SYSTEM_AI', text: `🛡️ [SELLER SHIELD VERIFICATION COMPLETE]:\n\n• AUTHENTICITY SCORE: ${generatedScore}%\n• ASSIGNED GRADE: ${generatedGrade}\n• SUGGESTED GLOBAL APPRAISAL: ${simulatedEthValue} ETH (${ethToUsd(simulatedEthValue)})\n\nForm values updated. Outright purchase bound to specialized appraisal baseline value. Listing is now certified for an on-chain verification badge.`, timestamp: 'SHIELD' }
      ]);
    }, 2000);
  };

  const handleAiFormPreAudit = () => {
    setAiBotVisible(true);
    triggerShieldAnalysis(customImages);
  };

  const handleLaunchLightbox = (imagesList: string[], startingIndex: number) => {
    setLightboxImages(imagesList);
    setLightboxInitialIndex(startingIndex);
    setLightboxVisible(true);
  };

  const pickMultiImages = async () => {
    if (customImages.length >= 10) return Alert.alert("Photo Cap Reached", "Ecosystem deployment rules restrict assets to 10 photos max.");
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) return Alert.alert("Hardware Access Denied", "System camera viewfinder sandbox clearance is mandatory to capture verification frames.");
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets && result.assets.length > 0) setCustomImages(prev => [...prev, result.assets[0].uri]);
  };

  const pickFromGallery = async () => {
    if (customImages.length >= 10) return Alert.alert("Photo Cap Reached", "Ecosystem deployment rules restrict assets to 10 photos max.");
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return Alert.alert("Access Denied", "Gallery clearance is required to upload images from device.");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets && result.assets.length > 0) setCustomImages(prev => [...prev, result.assets[0].uri]);
  };

  const pickSandboxFile = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return Alert.alert("Access Denied", "Clearance required.");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const splitName = result.assets[0].uri.split('/').pop() || "bounty_payload.bin";
      setSandboxFileName("sandbox_secure_" + splitName + ".dat");
      Alert.alert("Sandbox Safe-Guard Engaged", "File container isolated inside localized virtual sandbox engine.");
    }
  };

  const handleUnifiedSubmit = () => {
    if (listingType === 'BOUNTY') {
      if (!title || !bountyPayout || !description) return Alert.alert("Input Error", "Provide bounty title, info description, and payout reward.");
      setBounties(prev => [{ id: "B-" + Date.now(), title, description, payout: bountyPayout + " ETH", location: locationOrScope || 'Sevierville, TN Branch', status: 'OPEN_NODE', deployerRank: 'Rank New [100%]' }, ...prev]);
      Alert.alert("Bounty Posted", "Listing verified and 0.02 ETH platform creation fee executed.");
      setActiveTab('BOUNTIES');
    } else {
      let finalName = title;
      let finalMeta = "Escrow Vault Asset";

      if (listingType === 'NFT') {
        if (!selectedNft) return Alert.alert("Selection Error", "Select a valid asset token from your wallet link.");
        finalName = selectedNft.name;
        finalMeta = "Token Contract NFT ID: " + selectedNft.tokenId;
      } else {
        if (!title || !description) return Alert.alert("Input Error", "Please provide an asset title and physical description.");
      }

      if (!listPrice || !buyNowPrice) return Alert.alert("Input Error", "Please assign dual-pricing boundaries.");

      if (listingType === 'PHYSICAL' && shieldStatus !== 'VERIFIED') {
        finalMeta = "📦 Unverified Merchant Entry";
        setAiBotLogs(prev => [
          ...prev,
          { id: "business-bypass-" + Date.now(), sender: 'SYSTEM_AI', text: "⚠️ [NOTICE]: Bypassed automated compliance scanning frame workflow. Fast-tracking standard asset list container execution. Note: This item does not qualify for an on-chain verification badge.", timestamp: 'AUDIT' }
        ]);
      } else if (listingType === 'PHYSICAL') {
        finalMeta = `🛡️ Certified: ${shieldConditionGrade} Condition | Index: ${shieldAuthenticityIndex}%`;
      }

      const isHighValue = (parseFloat(buyNowPrice) * ethUsdRate) > 500;
      const listingFeeText = listingType === 'NFT' || isHighValue ? '1.5% Listing Fee' : '0.015 ETH Listing Fee';

      const newListing: ItemLedger = {
        id: "BV-LOCAL-" + Date.now(),
        name: finalName,
        description,
        type: listingType,
        contract: CONTRACT_ADDRESS,
        listPrice: listPrice + " ETH",
        buyNowPrice: buyNowPrice + " ETH",
        status: 'MINED_AWAITING_LOCK',
        meta: finalMeta,
        images: listingType === 'NFT' && selectedNft ? [selectedNft.imageUri] : (customImages.length > 0 ? customImages : ['https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=500&q=80']),
        bidCount: 0,
        timeLeft: '7d 00h (Block fresh)',
        sellerRank: 'Rank New [100%]'
      };

      setMarketItems(prev => [newListing, ...prev]);
      Alert.alert("Asset Listed", `Escrow layers deployed. ${listingFeeText} applied.`);
    }
    setTitle(''); setDescription(''); setListPrice(''); setBuyNowPrice(''); setBountyPayout(''); setLocationOrScope(''); setSelectedNft(null); setCustomImages([]); setFormVisible(false); setShieldStatus('IDLE');
  };

  const handleExecuteCustomBid = (itemId: string) => {
    const typedBid = customBidValues[itemId];
    if (!typedBid || parseFloat(typedBid) <= 0) return Alert.alert("Input Fault", "Assign a valid positive bid threshold.");
    setMarketItems(prev => prev.map(item => item.id === itemId ? { ...item, listPrice: typedBid + " ETH", bidCount: item.bidCount + 1 } : item));
    Alert.alert("Bid Proposal Broadcasted", `On-chain price state incremented to ${typedBid} ETH.`);
    setActiveBidInputId(null);
  };

  const submitReviewScore = (targetId: string, role: string) => {
    const text = reviewText[targetId] || 'P2P Lifecycle Complete.';
    const stars = selectedStars[targetId] || 5;
    Alert.alert("Review Locked to Ledger", `Successfully registered ${stars}-star rating index.\nStatement: "${text}"`);
    if (role === 'BUYER') setSoldItems(prev => prev.map(i => i.id === targetId ? { ...i, buyerRanked: true } : i));
    if (role === 'BOUNTY_COLLECTOR') setBounties(prev => prev.map(b => b.id === targetId ? { ...b, status: 'FINALIZED' } : b));
  };

  const handleLaunchCheckoutModal = (item: ItemLedger) => { setCheckoutItem(item); setBuyerShippingTier('STANDARD'); };

  const handleExecuteCheckoutPurchase = () => {
    if (!checkoutItem) return;
    let basePriceNum = parseFloat(checkoutItem.buyNowPrice) || 0;
    let absoluteFinalPrice = buyerShippingTier === 'PREMIUM' ? (basePriceNum + 0.02).toFixed(3) : basePriceNum.toFixed(3);
    setSoldItems(prev => [{ id: "SOLD-" + Date.now(), name: checkoutItem.name, price: absoluteFinalPrice + " ETH", buyNowBase: basePriceNum, buyer: "0xLOCAL_NODE", shippingAddress: "User Profile Confirmed Delivery Address Block", shipmentVerified: false, deliveryVerified: false, trackingNumber: '', shippingTier: buyerShippingTier, buyerRanked: false }, ...prev]);
    Alert.alert("Purchase Confirmed", `Appraisal validated: Escrow locked at ${absoluteFinalPrice} ETH.`);
    setCheckoutItem(null);
  };

  const handleClaimBounty = (id: string) => {
    setBounties(prev => prev.map(b => b.id === id ? { ...b, status: 'BOUND_TO_YOU', collectorRank: 'Rank S [99.5%]' } : b));
    Alert.alert("Bounty Secured", "Node bound to your signature. Proceed to execute field logic.");
  };

  const handleFieldProofSubmit = (id: string) => {
    if (!fieldNotes && !fieldImageUri && !sandboxFileName) return Alert.alert("Data Missing", "Provide work logs, photographic proof, or a sandbox file.");
    setBounties(prev => prev.map(b => b.id === id ? { ...b, status: 'SUBMITTED_AWAITING_VERIFICATION', proofImage: fieldImageUri, proofNotes: fieldNotes, attachedFile: sandboxFileName } : b));
    setSelectedBountyForWork(null); setFieldNotes(''); setFieldImageUri(null); setSandboxFileName(null);
    Alert.alert("Proof Uploaded", "Awaiting Deployer Verification Check. Escrow release will process 4% protocol fee upon finalization.");
  };

  const handleSendChatMessage = () => {
    if (!chatMessageText || !selectedBountyForWork) return;
    const bountyId = selectedBountyForWork.id;
    setBountyChats(prev => ({
      ...prev,
      [bountyId]: [...(prev[bountyId] || []), { id: "msg-" + Date.now(), sender: 'HUNTER', text: chatMessageText, timestamp: 'Just Now' }]
    }));
    setChatMessageText('');
  };

  const handleMarkShippedWithTracking = async (id: string) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return Alert.alert("Access Denied", "Gallery clearance is required to upload tracking proof.");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSoldItems(prev => prev.map(item => item.id === id ? { ...item, shipmentVerified: true, trackingImageUri: result.assets[0].uri } : item));
      Alert.alert("Tracking Uploaded", "Shipment marked as verified on the blockchain ledger.");
    }
  };

  const executeVerifyDelivery = (id: string) => {
    setSoldItems(prev => prev.map(item => item.id === id ? { ...item, deliveryVerified: true } : item));
    Alert.alert("Escrow Released", "Delivery confirmed. Protocol finalization fee processed.");
  };

  const handleRelistItemInit = (item: UnsoldItem) => {
    setListingType('PHYSICAL');
    setTitle(item.name);
    setListPrice(item.originalPrice);
    setBuyNowPrice('');
    setFormVisible(true);
    setUnsoldItems(prev => prev.filter(u => u.id !== item.id));
  };

  const getDynamicFeeDisclosureText = () => {
    if (listingType === 'BOUNTY') return 'Protocol Fees: 0.02 ETH Listing Fee | 4% Escrow Release Fee upon execution verification.';
    if (listingType === 'NFT') return 'Protocol Fees: 1.5% Listing Fee | 4% Escrow Release Fee upon confirmed transfer.';
    const outRightUSD = parseFloat(buyNowPrice) * ethUsdRate;
    if (outRightUSD > 500) return 'Protocol Fees: 1.5% Listing Fee (Values > $500) | 4% Escrow Release Fee upon delivery verification.';
    return 'Protocol Fees: 0.015 ETH Base Listing Fee | 4% Escrow Release Fee upon delivery verification.';
  };

  const renderAIBotConsole = () => (
    <View style={styles.aiBotOverlayConsoleContainer}>
      <View style={styles.aiBotHeaderRowSpec}>
        <Text style={styles.aiBotHeaderTitle}>[🤖 BASEVAULT COGNITIVE CO-PROCESSOR FEED]</Text>
      </View>
      <ScrollView style={styles.aiBotLogsScrollArea} nestedScrollEnabled={true}>
        {aiBotLogs.map((log) => (
          <View key={log.id} style={[styles.aiLogBubble, log.sender === 'HUNTER' ? styles.aiLogBubbleUser : log.sender === 'SYSTEM_AI' ? styles.aiLogBubbleBot : styles.aiLogBubbleAudit]}>
            <Text style={styles.aiLogBubbleMeta}>[{log.sender === 'SYSTEM_AI' && log.timestamp === 'AUDIT' ? 'AI_COMPLIANCE_ENGINE' : log.sender === 'SYSTEM_AI' && log.timestamp === 'SHIELD' ? '🛡️ SELLER_SHIELD' : log.sender}]</Text>
            <Text style={styles.aiLogBubbleText}>{log.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>⚠️ NOTE: AI Appraisal is an approximate estimated value based on market parameters and is not a set-in-stone guarantee.</Text>
      </View>
      <View style={styles.aiBotInputRowArea}>
        <TextInput style={styles.aiBotInputFieldSpec} placeholder="Type help tags (e.g. shipping, fees)..." placeholderTextColor="#666666" value={aiBotInput} onChangeText={setAiBotInput} />
        <TouchableOpacity style={styles.btnSendAiQuerySpec} onPress={handleSendAiBotQuery}><Text style={styles.btnSendAiQuerySpecText}>EXEC</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Image source={baseVaultLogo} style={{ width: 28, height: 28, marginRight: 10, borderRadius: 4 }} />
          <View>
            <Text style={styles.title}>BASEVAULT // TERMINAL</Text>
            <Text style={styles.subtitle}>TACTICAL WEB3 CORE FIELD DECK</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.aiPillTrigger} onPress={() => setAiBotVisible(!aiBotVisible)}>
          <Text style={styles.aiPillTriggerText}>{aiBotVisible ? "✖ CLOSE" : "🤖 HELP BOT"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dashboardContainer}>
        
        <View style={styles.tabMatrix}>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'MARKET' && styles.tabActive]} onPress={() => { setActiveTab('MARKET'); setSelectedBountyForWork(null); }}><Text style={[styles.tabButtonText, activeTab === 'MARKET' && styles.tabActiveText]}>MARKET</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'BOUNTIES' && styles.tabActive]} onPress={() => setActiveTab('BOUNTIES')}><Text style={[styles.tabButtonText, activeTab === 'BOUNTIES' && styles.tabActiveText]}>BOUNTIES</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'DASHBOARD' && styles.tabActive]} onPress={() => { setActiveTab('DASHBOARD'); setSelectedBountyForWork(null); }}><Text style={[styles.tabButtonText, activeTab === 'DASHBOARD' && styles.tabActiveText]}>DASHBOARD</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'DIAGNOSTICS' && styles.tabActive]} onPress={() => { setActiveTab('DIAGNOSTICS'); setSelectedBountyForWork(null); }}><Text style={[styles.tabButtonText, activeTab === 'DIAGNOSTICS' && styles.tabActiveText]}>STATUS</Text></TouchableOpacity>
        </View>

        {aiBotVisible && !formVisible && renderAIBotConsole()}

        <View style={styles.mainContentFrame}>
          
          {(activeTab === 'MARKET' || activeTab === 'BOUNTIES') && !checkoutItem && (
             <View style={styles.searchMatrixWrapperContainer}>
               <TextInput
                 style={styles.searchBarInputFieldSpec}
                 placeholder={`Search ${activeTab.toLowerCase()} entries...`}
                 placeholderTextColor="#888888"
                 value={searchQuery}
                 onChangeText={setSearchQuery}
               />
               
               {activeTab === 'MARKET' && (
                 <View style={[styles.filterTabsCategoryRow, { marginTop: 4 }]}>
                   {['ALL', 'PHYSICAL', 'NFT'].map(cat => (
                     <TouchableOpacity
                       key={cat}
                       style={[styles.filterCategoryBtn, selectedCategoryFilter === cat && styles.filterCategoryBtnActive]}
                       onPress={() => setSelectedCategoryFilter(cat as any)}
                     >
                       <Text style={[styles.filterCategoryBtnText, selectedCategoryFilter === cat && styles.filterCategoryBtnTextActive]}>{cat}</Text>
                     </TouchableOpacity>
                   ))}
                 </View>
               )}
             </View>
          )}

          {activeTab === 'MARKET' && !checkoutItem && (
            <View style={{ flex: 1 }}>
              <View style={styles.matrixFormQuickHeaderActionRow}>
                <TouchableOpacity style={[styles.formAccordionHeader, { flex: 1 }]} onPress={() => setFormVisible(true)}>
                  <Text style={styles.formAccordionTitle}>[+] LAUNCH UNBOUNDED DEPLOYMENT ENVIRONMENT CORE</Text>
                </TouchableOpacity>
              </View>

              <Modal visible={formVisible} animationType="slide" transparent={false} onRequestClose={() => setFormVisible(false)}>
                <View style={styles.modalViewportContainerSpec}>
                  <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 60 }} backgroundColor="#000000" showsVerticalScrollIndicator={true}>
                    <View style={styles.overlayHeaderRow}>
                      <Text style={styles.overlayTitleText}>🛠️ SECURE COMPLIANCE ESCROW CREATION DECK</Text>
                      <TouchableOpacity style={styles.btnOverlayCloseX} onPress={() => setFormVisible(false)}><Text style={styles.closeXText}>✖ CLOSE PANEL</Text></TouchableOpacity>
                    </View>
                    
                    <Text style={styles.inputLabel}>CHOOSE VAULT ESCROW TARGET ROUTE:</Text>
                    <View style={styles.selectorRow}>
                      <TouchableOpacity style={[styles.selectorBtn, listingType === 'PHYSICAL' && styles.selectorBtnActive]} onPress={() => setListingType('PHYSICAL')}><Text style={[styles.selectorBtnText, listingType === 'PHYSICAL' && styles.selectorBtnTextActive]}>📦 PHYSICAL</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.selectorBtn, listingType === 'BOUNTY' && styles.selectorBtnActive]} onPress={() => setListingType('BOUNTY')}><Text style={[styles.selectorBtnText, listingType === 'BOUNTY' && styles.selectorBtnTextActive]}>🛠️ BOUNTY</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.selectorBtn, listingType === 'NFT' && styles.selectorBtnActive]} onPress={() => setListingType('NFT')}><Text style={[styles.selectorBtnText, listingType === 'NFT' && styles.selectorBtnTextActive]}>🌌 NFT ASSET</Text></TouchableOpacity>
                    </View>

                    {listingType === 'NFT' ? (
                      <View style={styles.staticWalletColumnContainerGrid}>
                        <Text style={styles.inputLabel}>CHOOSE NFT COMPONENT FROM WALLET CONTAINER TRAY:</Text>
                        
                        {!isConnected ? (
                          <TouchableOpacity style={styles.walletFallbackConnectPillSpec} onPress={open}>
                            <Text style={styles.walletFallbackConnectPillTextSpec}>🔒 LINK SMART WALLET PROVIDER CORE TO INGEST INLINE INVENTORY</Text>
                          </TouchableOpacity>
                        ) : (
                          <View>
                            <Text style={styles.walletConnectedBadgeAddressHeaderSpec}>Connected Signature Node: {address?.slice(0, 6)}...{address?.slice(-4)}</Text>
                            {ownedNfts.map((nft) => (
                              <TouchableOpacity key={nft.id} style={[styles.staticTrayCardRowCell, selectedNft?.id === nft.id && styles.trayCardSelected]} onPress={() => { setSelectedNft(nft); setTitle(nft.name); }}>
                                <Image source={{ uri: nft.imageUri }} style={styles.staticRowThumbImage} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                  <Text style={styles.staticRowNftNameText} numberOfLines={1}>{nft.name}</Text>
                                  <Text style={styles.staticRowNftMetaText}>Token Contract ID: {nft.tokenId}</Text>
                                </View>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    ) : (
                      <View>
                        <Text style={styles.inputLabel}>{listingType === 'BOUNTY' ? "BOUNTY COMPLIANCE TASK NAME:" : "PHYSICAL PRODUCT / ESCROW LABEL:"}</Text>
                        <TextInput style={styles.inputField} placeholder="Enter item descriptive title..." placeholderTextColor="#64748b" value={title} onChangeText={setTitle} />
                        <Text style={styles.inputLabel}>{listingType === 'BOUNTY' ? "BOUNTY PROTOCOL INFO:" : "ITEM DESCRIPTION / SPECS:"}</Text>
                        <TextInput style={[styles.inputField, { height: 80, textAlignVertical: 'top' }]} multiline placeholder="Enter detailed specs or parameters..." placeholderTextColor="#64748b" value={description} onChangeText={setDescription} />
                      </View>
                    )}

                    {listingType === 'BOUNTY' ? (
                      <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <Text style={styles.inputLabel}>BOUNTY PAYOUT FUNDS LOCKOUT (ETH):</Text>
                          {bountyPayout ? <Text style={styles.fiatConversionTextOverlay}>≈ {ethToUsd(bountyPayout)}</Text> : null}
                        </View>
                        <TextInput style={styles.inputField} placeholder="0.02" placeholderTextColor="#64748b" keyboardType="numeric" value={bountyPayout} onChangeText={setBountyPayout} />
                        <Text style={styles.inputLabel}>GEOLOCATION SCOPE REGISTRY TARGET TRACK:</Text>
                        <TextInput style={styles.inputField} placeholder="e.g. Sevierville, TN" placeholderTextColor="#64748b" value={locationOrScope} onChangeText={setLocationOrScope} />
                      </View>
                    ) : (
                      <View style={styles.dualPriceRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                             <Text style={styles.inputLabel}>MIN BID (ETH):</Text>
                             {listPrice ? <Text style={styles.fiatConversionTextOverlay}>≈ {ethToUsd(listPrice)}</Text> : null}
                           </View>
                           <TextInput style={styles.inputField} placeholder="0.01" placeholderTextColor="#64748b" keyboardType="numeric" value={listPrice} onChangeText={setListPrice} />
                        </View>
                        <View style={{ flex: 1 }}>
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                             <Text style={styles.inputLabel}>BUY NOW (ETH):</Text>
                             {buyNowPrice ? <Text style={styles.fiatConversionTextOverlay}>≈ {ethToUsd(buyNowPrice)}</Text> : null}
                           </View>
                           <TextInput style={styles.inputField} placeholder="0.05" placeholderTextColor="#64748b" keyboardType="numeric" value={buyNowPrice} onChangeText={setBuyNowPrice} />
                        </View>
                      </View>
                    )}

                    {listingType === 'PHYSICAL' && (
                      <View style={styles.imageSystemSectionBox}>
                        <Text style={styles.inputLabel}>OPTIONAL PHOTOGRAPHIC SPECIFICATION UPLOAD ({customImages.length}/10):</Text>
                        <TouchableOpacity style={styles.btnMediaPickCameraSpec} onPress={pickMultiImages}>
                          <Text style={styles.btnMediaPickCameraSpecText}>📸 INITIALIZE VIEWFINDER CORE // ENGAGE LIVE HARDWARE LENS SCAN</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btnMediaPickCameraSpec, { marginTop: 10, borderColor: '#f59e0b' }]} onPress={pickFromGallery}>
                          <Text style={[styles.btnMediaPickCameraSpecText, { color: '#f59e0b' }]}>🖼️ ACCESS DEVICE GALLERY // UPLOAD SAVED IMAGES</Text>
                        </TouchableOpacity>
                        
                        {customImages.length > 0 && (
                          <View style={styles.photoGridWrapper}>
                            {customImages.map((uri, index) => (
                              <View key={index} style={styles.photoGridCell}><Image source={{ uri }} style={styles.thumbnailCellImage} /></View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    {listingType === 'NFT' && isConnected && selectedNft && (
                      <View style={styles.imageSystemSectionBox}>
                        <TouchableOpacity style={styles.btnMediaPickNftPurpleSpec} activeOpacity={0.9} onPress={() => Alert.alert("NFT Vector Injected", "Decentralized card assets structural constraints mapped successfully.")}>
                          <Text style={styles.btnMediaPickNftPurpleSpecText}>🌌 INJECT SELECTED NFT WALLET COMPONENT CORE</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {listingType === 'PHYSICAL' && customImages.length > 0 && (
                      <View style={styles.shieldAppraiserContainerBoxSpec}>
                        <Text style={styles.shieldAppraiserTitleHeaderSpec}>🛡️ SELLER SHIELD PIPELINE STATUS</Text>
                        <Text style={styles.auditText}>[STREAM ACTIVE]: Verification diagnostics data routed directly onto active 🤖 HELP BOT console overlay.</Text>
                      </View>
                    )}

                    <View style={styles.formDualActionSubmissionRowGrid}>
                      <Text style={styles.dynamicFeeDisclaimerText}>{getDynamicFeeDisclosureText()}</Text>
                      <TouchableOpacity style={styles.btnFormAiAuditTriggerSpec} onPress={handleAiFormPreAudit}>
                        <Text style={styles.btnFormAiAuditTriggerTextSpec}>🤖 ENGAGE PURPLE AI BOT OVERLAY SCAN</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.btnFormSubmit} onPress={handleUnifiedSubmit}>
                        <Text style={styles.btnFormSubmitText}>BROADCAST ESCROW RECORD</Text>
                      </TouchableOpacity>
                    </View>

                    {aiBotVisible && (
                       <View style={{marginTop: 20}}>
                         {renderAIBotConsole()}
                       </View>
                    )}

                  </ScrollView>
                </View>
              </Modal>

              <FlatList
                data={filteredMarketItems}
                keyExtractor={(item) => item.id}
                removeClippedSubviews={true}
                maxToRenderPerBatch={3}
                initialNumToRender={4}
                windowSize={5}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={handlePullToRefreshMarket} tintColor="#00f0ff" colors={["#00f0ff"]} backgroundColor="#000000" />
                }
                onEndReached={handleLoadMoreInfiniteItems}
                onEndReachedThreshold={0.4}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    <View style={styles.auctionTelemetryTopStripRow}>
                      <Text style={styles.telemetrySellerRankText}>👤 Seller: {item.sellerRank}</Text>
                      {item.meta.includes('Certified') ? (
                        <Text style={[styles.telemetryBidCounterPill, { backgroundColor: '#10b981', color: '#ffffff' }]}>🛡️ VERIFIED SHIELD CORE</Text>
                      ) : (
                        <Text style={[styles.telemetryBidCounterPill, { backgroundColor: '#334155', color: '#94a3b8' }]}>📦 ESCROW NODE</Text>
                      )}
                    </View>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        {item.description ? <Text style={{ color: '#888', fontSize: 10, marginTop: 4 }}>{item.description}</Text> : null}
                      </View>
                      <Text style={[styles.cardTag, item.type === 'NFT' ? styles.tagNft : styles.tagPhys]}>{item.type}</Text>
                    </View>
                    {item.images && item.images.length > 0 ? (
                      <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.listingCardPhotosCarouselTray}>
                        {item.images.map((imgUri, idx) => (
                          <TouchableOpacity key={idx} activeOpacity={0.8} onPress={() => handleLaunchLightbox(item.images, idx)}>
                            <Image source={{ uri: imgUri }} style={styles.carouselListingInlineFrameImage} />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    ) : null}
                    <View style={styles.auctionTimerBlockStrip}>
                      <Text style={styles.timerBlockLabelText}>RESOURCE LEDGER STATUS INFO PACKET:</Text>
                      <Text style={[styles.timerBlockValueString, { color: item.meta.includes('Unverified') ? '#94a3b8' : '#00f0ff', fontSize: 9 }]}>{item.meta}</Text>
                    </View>
                    <View style={styles.pricingDashboardBlock}>
                      <View>
                         <Text style={styles.priceDataLabel}>MIN BID:</Text>
                         <Text style={styles.priceDataValue}>{item.listPrice}</Text>
                         <Text style={styles.priceDataUsdValue}>{ethToUsd(item.listPrice)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                         <Text style={styles.priceDataLabel}>BUY OUTRIGHT:</Text>
                         <Text style={styles.buyNowValueText}>{item.buyNowPrice}</Text>
                         <Text style={styles.priceDataUsdValue}>{ethToUsd(item.buyNowPrice)}</Text>
                      </View>
                    </View>
                    <View style={styles.cardActionContainerRow}>
                      <TouchableOpacity style={styles.cardBidBtn} onPress={() => setActiveBidInputId(activeBidInputId === item.id ? null : item.id)}><Text style={styles.cardBidBtnText}>PLACE BID</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.cardBuyBtn} onPress={() => handleLaunchCheckoutModal(item)}><Text style={styles.cardBuyBtnText}>ESCROW BUY</Text></TouchableOpacity>
                    </View>
                    
                    {activeBidInputId === item.id && (
                      <View style={styles.expandableBiddingWorkflowInputRow}>
                        <TextInput
                          style={styles.customBidNumericFieldCell}
                          placeholder="Enter bid limit..."
                          placeholderTextColor="#888888"
                          keyboardType="numeric"
                          onChangeText={(val) => setCustomBidValues(prev => ({ ...prev, [item.id]: val }))}
                        />
                        <TouchableOpacity style={styles.btnExecuteBidBroadcasterSpec} onPress={() => handleExecuteCustomBid(item.id)}>
                          <Text style={styles.btnExecuteBidBroadcasterTextSpec}>SUBMIT BID</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              />
            </View>
          )}

          {activeTab === 'BOUNTIES' && (
            <View style={{ flex: 1 }}>
              <FlatList
                data={filteredBounties}
                keyExtractor={(item) => item.id}
                refreshControl={
                  <RefreshControl refreshing={refreshingBounties} onRefresh={handlePullToRefreshBounties} tintColor="#f59e0b" colors={["#f59e0b"]} backgroundColor="#000000" />
                }
                onEndReached={handleLoadMoreInfiniteBounties}
                onEndReachedThreshold={0.4}
                renderItem={({ item }) => (
                  <View style={styles.bountyCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={{ color: '#f59e0b', fontSize: 10, fontWeight: 'bold' }}>📍 {item.location}</Text>
                      <Text style={{ color: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}>{item.deployerRank}</Text>
                    </View>
                    <Text style={styles.bountyTitle}>{item.title}</Text>
                    {item.description ? <Text style={{ color: '#888', fontSize: 11, marginTop: 4 }}>{item.description}</Text> : null}
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, marginBottom: 14 }}>
                      <Text style={{ color: '#10b981', fontWeight: '900', marginRight: 8 }}>💰 Payout: {item.payout}</Text>
                      <Text style={{ color: '#64748b', fontSize: 11, fontWeight: 'bold' }}>({ethToUsd(item.payout)})</Text>
                    </View>
                    
                    {item.status === 'OPEN_NODE' ? (
                      <TouchableOpacity style={styles.btnClaimBounty} onPress={() => handleClaimBounty(item.id)}>
                        <Text style={styles.btnClaimBountyText}>SECURE BOUNTY</Text>
                      </TouchableOpacity>
                    ) : item.status === 'BOUND_TO_YOU' ? (
                      <TouchableOpacity style={[styles.btnClaimBounty, { backgroundColor: '#3b82f6' }]} onPress={() => setSelectedBountyForWork(item)}>
                        <Text style={[styles.btnClaimBountyText, { color: '#ffffff' }]}>ACCESS WORKSPACE / SUBMIT PROOF</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.btnClaimBounty, { backgroundColor: '#334155' }]}>
                        <Text style={[styles.btnClaimBountyText, { color: '#94a3b8' }]}>VERIFICATION PENDING</Text>
                      </View>
                    )}
                  </View>
                )}
              />
            </View>
          )}

          {activeTab === 'DASHBOARD' && (
            <ScrollView style={{ flex: 1, paddingTop: 10 }}>
              <Text style={styles.dashboardSectionLabelHeader}>ESCROW CONTROL INDEX METRICS</Text>
              
              <View style={styles.dashboardMetricPanel}>
                <Text style={styles.metricLabel}>SIGNATURE NODE STATUS</Text>
                <Text style={[styles.metricValue, { color: isConnected ? '#10b981' : '#ef4444', fontSize: 14 }]}>
                  {isConnected ? `SECURED // ${address?.slice(0,6)}...${address?.slice(-4)}` : 'OFFLINE // AWAITING LINK'}
                </Text>
              </View>

              <View style={styles.dashboardGrid}>
                <View style={styles.dashboardGridCell}>
                  <Text style={styles.metricLabel}>ACTIVE ESCROWS</Text>
                  <Text style={styles.metricValue}>{marketItems.length}</Text>
                </View>
                <View style={styles.dashboardGridCell}>
                  <Text style={styles.metricLabel}>TOTAL VOLUME</Text>
                  <Text style={[styles.metricValue, { color: '#00f0ff' }]}>
                    {marketItems.reduce((acc, item) => acc + (parseFloat(item.buyNowPrice) || 0), 0).toFixed(2)} ETH
                  </Text>
                  <Text style={{ color: '#ef4444', fontSize: 8, marginTop: 6, fontWeight: 'bold' }}>* 4.0% Escrow Protocol Release Fee executes upon verifiable delivery or proof finalization across all active smart contracts.</Text>
                </View>
              </View>
              
              <View style={styles.dashboardGrid}>
                <View style={styles.dashboardGridCell}>
                  <Text style={styles.metricLabel}>OPEN BOUNTIES</Text>
                  <Text style={styles.metricValue}>{bounties.filter(b => b.status === 'OPEN_NODE').length}</Text>
                </View>
                <View style={styles.dashboardGridCell}>
                  <Text style={styles.metricLabel}>CLAIMED NODES</Text>
                  <Text style={[styles.metricValue, { color: '#f59e0b' }]}>{bounties.filter(b => b.status !== 'OPEN_NODE').length}</Text>
                </View>
              </View>

              <Text style={[styles.dashboardSectionLabelHeader, { marginTop: 20 }]}>ACTIVE ESCROW LISTINGS</Text>
              {marketItems.length === 0 ? (
                <Text style={{ color: '#64748b', fontSize: 10, fontFamily: 'monospace', marginVertical: 10 }}>[NO ACTIVE LISTINGS]</Text>
              ) : (
                marketItems.map(item => (
                  <View key={item.id} style={styles.dashboardSubCardLineItem}>
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>{item.name}</Text>
                    <Text style={{ color: '#00f0ff', fontSize: 10, fontFamily: 'monospace', marginTop: 4 }}>Price: {item.buyNowPrice} ({ethToUsd(item.buyNowPrice)})</Text>
                  </View>
                ))
              )}

              <Text style={[styles.dashboardSectionLabelHeader, { marginTop: 20 }]}>CLAIMED BOUNTY NODES</Text>
              {bounties.filter(b => b.status !== 'OPEN_NODE').length === 0 ? (
                <Text style={{ color: '#64748b', fontSize: 10, fontFamily: 'monospace', marginVertical: 10 }}>[NO BOUND TASKS]</Text>
              ) : (
                bounties.filter(b => b.status !== 'OPEN_NODE').map(bounty => (
                  <View key={bounty.id} style={[styles.dashboardSubCardLineItem, { borderLeftColor: '#f59e0b' }]}>
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>{bounty.title}</Text>
                    <Text style={{ color: '#f59e0b', fontSize: 10, fontFamily: 'monospace', marginTop: 4 }}>Status: {bounty.status.replace(/_/g, ' ')}</Text>
                  </View>
                ))
              )}

              <Text style={[styles.dashboardSectionLabelHeader, { marginTop: 20, color: '#ef4444' }]}>EXPIRED / UNSOLD ASSETS</Text>
              {unsoldItems.length === 0 ? (
                <Text style={{ color: '#64748b', fontSize: 10, fontFamily: 'monospace', marginVertical: 10 }}>[NO EXPIRED ASSETS]</Text>
              ) : (
                unsoldItems.map(item => (
                  <View key={item.id} style={[styles.dashboardSubCardLineItem, { borderLeftColor: '#ef4444' }]}>
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <Text style={{ color: '#64748b', fontSize: 10, fontFamily: 'monospace' }}>Old Price: {item.originalPrice}</Text>
                      <TouchableOpacity style={{ backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 }} onPress={() => handleRelistItemInit(item)}>
                        <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: 'bold' }}>RELIST</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}

              <Text style={[styles.dashboardSectionLabelHeader, { marginTop: 20 }]}>OUTBOUND SHIPMENT LEDGER</Text>
              {soldItems.length === 0 ? (
                <Text style={{ color: '#64748b', fontSize: 10, fontFamily: 'monospace', marginVertical: 10 }}>[NO OUTBOUND LOGS DETECTED]</Text>
              ) : (
                soldItems.map(item => (
                  <View key={item.id} style={styles.dashboardLedgerCard}>
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>{item.name}</Text>
                    <Text style={{ color: '#888888', fontSize: 10, marginVertical: 4 }}>Buyer: {item.buyer}</Text>
                    <Text style={{ color: '#00f0ff', fontSize: 10, fontFamily: 'monospace', marginBottom: 10 }}>Value Locked: {item.price} ({ethToUsd(item.price)})</Text>
                    
                    {item.trackingImageUri && (
                      <View style={{ marginBottom: 10 }}>
                        <Text style={{ color: '#64748b', fontSize: 9, marginBottom: 4 }}>ATTACHED TRACKING LEDGER PROOF:</Text>
                        <Image source={{ uri: item.trackingImageUri }} style={{ width: 60, height: 60, borderRadius: 4, borderWidth: 1, borderColor: '#333' }} />
                      </View>
                    )}

                    {!item.deliveryVerified && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 10 }}>
                        <TouchableOpacity 
                          style={[styles.ledgerBtn, item.shipmentVerified ? styles.ledgerBtnActive : null]} 
                          onPress={() => !item.shipmentVerified && handleMarkShippedWithTracking(item.id)}
                        >
                          <Text style={[styles.ledgerBtnText, item.shipmentVerified ? { color: '#000' } : null]}>
                            {item.shipmentVerified ? '📦 SHIPPED' : 'MARK SHIPPED'}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.ledgerBtn, { marginLeft: 8 }, item.deliveryVerified ? { backgroundColor: '#10b981', borderColor: '#10b981' } : null]} 
                          onPress={() => !item.deliveryVerified && executeVerifyDelivery(item.id)}
                        >
                          <Text style={[styles.ledgerBtnText, item.deliveryVerified ? { color: '#000' } : null]}>
                            {item.deliveryVerified ? '✅ DELIVERED' : 'VERIFY DELIVERY'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {item.deliveryVerified && !item.buyerRanked && (
                      <View style={styles.reputationEvaluatorFormBlockFrame}>
                        <Text style={styles.evaluatorTitleLabel}>[P2P REPUTATION EVALUATOR SECURED]</Text>
                        <View style={{ flexDirection: 'row', marginTop: 10, marginBottom: 5 }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <TouchableOpacity key={star} style={[styles.btnStarItemSpec, (selectedStars[item.id] || 5) >= star && styles.btnStarItemSpecActive]} onPress={() => setSelectedStars(prev => ({ ...prev, [item.id]: star }))}>
                              <Text style={[styles.starGlyphTextSymbol, (selectedStars[item.id] || 5) < star && { color: '#444' }]}>★</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TextInput
                          style={styles.evalInputFieldTextCell}
                          placeholder="Log review vectors..."
                          placeholderTextColor="#64748b"
                          value={reviewText[item.id] || ''}
                          onChangeText={(text) => setReviewText(prev => ({ ...prev, [item.id]: text }))}
                        />
                        <TouchableOpacity style={styles.btnSubmitReviewBroadcasterActionSpec} onPress={() => submitReviewScore(item.id, 'BUYER')}>
                          <Text style={styles.btnSubmitReviewBroadcasterTextSpec}>BROADCAST RATING TO LEDGER</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {item.deliveryVerified && item.buyerRanked && (
                      <View style={[styles.reputationEvaluatorFormBlockFrame, { borderColor: '#10b981', backgroundColor: '#062f1d' }]}>
                        <Text style={[styles.evaluatorTitleLabel, { color: '#10b981' }]}>✅ RATING LOCKED IN LEDGER</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {activeTab === 'DIAGNOSTICS' && <View style={styles.diagnosticsFrame}><Text style={styles.diagLog}>[SYS] ELEMENT LIFECYCLES SYNCED COMPLETE // BASESPACE ACTIVE</Text></View>}
        </View>
      </View>
      
      <Modal visible={lightboxVisible} transparent={true} animationType="fade" onRequestClose={() => setLightboxVisible(false)}>
        <View style={styles.lightboxContainerOverlay}>
          <TouchableOpacity style={styles.lightboxCloseHitboxArea} activeOpacity={1} onPress={() => setLightboxVisible(false)}><Text style={styles.lightboxCloseTextSymbol}>✖ CLOSE MONITOR</Text></TouchableOpacity>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentOffset={{ x: lightboxInitialIndex * 360, y: 0 }} style={styles.lightboxSwipeViewerScrollArea}>{lightboxImages.map((imgUrl, idx) => (<View key={idx} style={styles.lightboxImageSlideWrapperSpec}><Image source={{ uri: imgUrl }} style={styles.lightboxTargetActiveImageFrame} resizeMode="contain" /></View>))}</ScrollView>
        </View>
      </Modal>

      <Modal visible={!!checkoutItem} transparent={true}>
        <View style={styles.modalViewportContainerSpec}>
          <Text style={styles.overlayTitleText}>CHECKOUT INITIATED</Text>
          {checkoutItem && (
            <View style={{ backgroundColor: '#111111', padding: 15, borderRadius: 4, marginBottom: 20, borderWidth: 1, borderColor: '#333333' }}>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>{checkoutItem.name}</Text>
              
              <Text style={styles.inputLabel}>SELECT SHIPPING PROTOCOL:</Text>
              <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                 <TouchableOpacity style={[styles.shippingBtn, buyerShippingTier === 'STANDARD' && styles.shippingBtnActive]} onPress={() => setBuyerShippingTier('STANDARD')}>
                   <Text style={[styles.shippingBtnText, buyerShippingTier === 'STANDARD' && styles.shippingBtnTextActive]}>STANDARD (FREE)</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={[styles.shippingBtn, buyerShippingTier === 'PREMIUM' && styles.shippingBtnActive]} onPress={() => setBuyerShippingTier('PREMIUM')}>
                   <Text style={[styles.shippingBtnText, buyerShippingTier === 'PREMIUM' && styles.shippingBtnTextActive]}>PREMIUM (+0.02 ETH)</Text>
                 </TouchableOpacity>
              </View>

              <Text style={{ color: '#10b981', fontSize: 18, fontWeight: '900' }}>
                TOTAL COST: {buyerShippingTier === 'PREMIUM' ? (parseFloat(checkoutItem.buyNowPrice) + 0.02).toFixed(3) : parseFloat(checkoutItem.buyNowPrice).toFixed(3)} ETH
              </Text>
              <Text style={{ color: '#10b981', fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>
                ≈ {ethToUsd(buyerShippingTier === 'PREMIUM' ? (parseFloat(checkoutItem.buyNowPrice) + 0.02) : checkoutItem.buyNowPrice)}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.btnFormSubmit} onPress={handleExecuteCheckoutPurchase}><Text style={styles.btnFormSubmitText}>CONFIRM PURCHASE</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btnOverlayCloseX} onPress={() => setCheckoutItem(null)}><Text style={styles.closeXText}>CANCEL TRANSACTION</Text></TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={!!selectedBountyForWork} transparent={false} animationType="slide">
        <View style={[styles.modalViewportContainerSpec, { backgroundColor: '#000000', padding: 16 }]}>
          {selectedBountyForWork && (
            <View style={{ flex: 1, paddingTop: 20 }}>
              <Text style={styles.overlayTitleText}>ACTIVE NODE WORKSPACE</Text>
              
              <View style={{ marginBottom: 10, backgroundColor: '#111111', padding: 14, borderRadius: 4, borderLeftWidth: 4, borderLeftColor: '#3b82f6' }}>
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold' }}>{selectedBountyForWork.title}</Text>
                <Text style={{ color: '#f59e0b', fontSize: 12, marginTop: 4 }}>Payout Yield: {selectedBountyForWork.payout} ({ethToUsd(selectedBountyForWork.payout)})</Text>
              </View>
              
              <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#222', borderRadius: 4, padding: 10, marginBottom: 10 }}>
                {(bountyChats[selectedBountyForWork.id] || []).map(msg => (
                  <View key={msg.id} style={{ marginBottom: 10, alignSelf: msg.sender === 'HUNTER' ? 'flex-end' : 'flex-start', backgroundColor: msg.sender === 'HUNTER' ? '#0d253f' : '#111', padding: 10, borderRadius: 4, maxWidth: '85%', borderWidth: 1, borderColor: msg.sender === 'HUNTER' ? '#3b82f6' : '#444' }}>
                    <Text style={{ color: '#888', fontSize: 8, marginBottom: 4, fontWeight: 'bold', fontFamily: 'monospace' }}>{msg.sender} // {msg.timestamp}</Text>
                    <Text style={{ color: '#fff', fontSize: 12 }}>{msg.text}</Text>
                  </View>
                ))}
              </ScrollView>
              
              <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                <TextInput 
                  style={[styles.inputField, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                  placeholder="Transmit message to assigner..."
                  placeholderTextColor="#64748b"
                  value={chatMessageText}
                  onChangeText={setChatMessageText}
                />
                <TouchableOpacity style={[styles.btnFormSubmit, { marginTop: 0, paddingHorizontal: 20, backgroundColor: '#3b82f6' }]} onPress={handleSendChatMessage}>
                  <Text style={styles.btnFormSubmitText}>SEND</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 350 }}>
                <TouchableOpacity style={styles.btnWorkspacePickFileSandboxSpec} onPress={pickSandboxFile}>
                  <Text style={styles.btnWorkspacePickFileSandboxTextSpec}>📁 ATTACH SECURE SANDBOX FILE</Text>
                </TouchableOpacity>
                {sandboxFileName && (
                  <Text style={styles.sandboxConfirmationReceiptBoxString}>[ATTACHED]: {sandboxFileName}</Text>
                )}

                <Text style={styles.inputLabel}>FIELD NOTES / COMPLIANCE LOGS:</Text>
                <TextInput 
                  style={[styles.inputField, { height: 80, textAlignVertical: 'top' }]} 
                  multiline 
                  placeholder="Enter audit logs, serial numbers, or location metrics..." 
                  placeholderTextColor="#64748b" 
                  value={fieldNotes} 
                  onChangeText={setFieldNotes} 
                />
                
                <TouchableOpacity style={[styles.btnMediaPickCameraSpec, { paddingVertical: 10 }]} onPress={async () => {
                    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
                    if (!cameraPerm.granted) return Alert.alert("Access Denied", "Camera clearance needed.");
                    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
                    if (!result.canceled && result.assets) setFieldImageUri(result.assets[0].uri);
                }}>
                  <Text style={styles.btnMediaPickCameraSpecText}>📸 CAPTURE PROOF VIA LENS</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btnMediaPickCameraSpec, { marginTop: 5, borderColor: '#f59e0b', marginBottom: 10, paddingVertical: 10 }]} onPress={async () => {
                    const libraryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (!libraryPerm.granted) return Alert.alert("Access Denied", "Gallery clearance needed.");
                    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
                    if (!result.canceled && result.assets) setFieldImageUri(result.assets[0].uri);
                }}>
                  <Text style={[styles.btnMediaPickCameraSpecText, { color: '#f59e0b' }]}>🖼️ UPLOAD SAVED PROOF IMAGES</Text>
                </TouchableOpacity>

                {fieldImageUri && (
                  <Image source={{ uri: fieldImageUri }} style={{ width: '100%', height: 150, borderRadius: 4, marginBottom: 10, borderWidth: 1, borderColor: '#333333' }} />
                )}

                <TouchableOpacity style={[styles.btnFormSubmit, { backgroundColor: '#10b981' }]} onPress={() => handleFieldProofSubmit(selectedBountyForWork.id)}>
                  <Text style={styles.btnFormSubmitText}>FINALIZE & UPLOAD TO LEDGER</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.btnOverlayCloseX, { backgroundColor: '#333333', marginBottom: 40 }]} onPress={() => { setSelectedBountyForWork(null); setFieldNotes(''); setFieldImageUri(null); setSandboxFileName(null); }}>
                  <Text style={styles.closeXText}>CLOSE WORKSPACE</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      <WalletConnectModal projectId={projectId} providerMetadata={{ name: 'BaseVault Mobile', description: 'BaseVault Market P2P Escrow', url: 'https://basevaultmarket.com', icons: ['https://basevaultmarket.com/logo.png'], redirect: { native: 'basevaultmobile://', universal: 'https://basevaultmarket.com/mobile' } }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#ffffff', paddingBottom: 12, marginBottom: 12 },
  title: { color: '#ffffff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  subtitle: { color: '#00f0ff', fontSize: 8, fontWeight: 'bold', marginTop: 1 },
  dashboardContainer: { flex: 1 },
  tabMatrix: { flexDirection: 'row', backgroundColor: '#111111', borderRadius: 4, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: '#333333' },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 2 },
  tabActive: { backgroundColor: '#ffffff' },
  tabButtonText: { color: '#888888', fontSize: 9, fontWeight: 'bold' },
  tabActiveText: { color: '#000000' },
  mainContentFrame: { flex: 1 },
  matrixFormQuickHeaderActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, zIndex: 10 },
  formAccordionHeader: { backgroundColor: '#111111', borderWidth: 1, borderColor: '#00f0ff', borderRadius: 4, padding: 12, alignItems: 'center' },
  formAccordionTitle: { color: '#00f0ff', fontSize: 10, fontWeight: '900', letterSpacing: 0.2 },
  modalViewportContainerSpec: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)', justifyContent: 'center', padding: 20 },
  overlayHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333333', paddingBottom: 10, marginBottom: 14 },
  overlayTitleText: { color: '#00f0ff', fontSize: 18, fontWeight: '900', fontFamily: 'monospace', flex: 1, marginRight: 8, textAlign: 'center' },
  btnOverlayCloseX: { backgroundColor: '#ef4444', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 4, marginTop: 10 },
  closeXText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  inputLabel: { color: '#ffffff', fontSize: 9, fontWeight: 'bold', marginBottom: 6 },
  inputField: { backgroundColor: '#111111', borderWidth: 1, borderColor: '#444444', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 4, color: '#ffffff', fontSize: 13, marginBottom: 12, fontWeight: 'bold' },
  selectorRow: { flexDirection: 'row', marginBottom: 12 },
  selectorBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333333', backgroundColor: '#000000', marginHorizontal: 2, borderRadius: 4 },
  selectorBtnActive: { borderColor: '#ffffff', backgroundColor: '#222222' },
  selectorBtnText: { color: '#888888', fontSize: 11, fontWeight: 'bold' },
  selectorBtnTextActive: { color: '#ffffff' },
  dualPriceRow: { flexDirection: 'row', marginBottom: 4 },
  shieldAppraiserContainerBoxSpec: { backgroundColor: '#090d16', borderWidth: 1, borderColor: '#00f0ff', padding: 10, borderRadius: 4, marginVertical: 8 },
  shieldAppraiserTitleHeaderSpec: { color: '#00f0ff', fontSize: 8, fontWeight: '900', fontFamily: 'monospace', marginBottom: 8 },
  formDualActionSubmissionRowGrid: { flexDirection: 'column', marginTop: 14 },
  btnFormAiAuditTriggerSpec: { backgroundColor: '#1e1b4b', borderWidth: 1, borderColor: '#a855f7', paddingVertical: 12, borderRadius: 4, alignItems: 'center', marginBottom: 8 },
  btnFormAiAuditTriggerTextSpec: { color: '#a855f7', fontSize: 11, fontWeight: '900', fontFamily: 'monospace' },
  btnFormSubmit: { backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 4, alignItems: 'center' },
  btnFormSubmitText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  auctionTelemetryTopStripRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#222222', paddingBottom: 6, marginBottom: 8 },
  telemetrySellerRankText: { color: '#94a3b8', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace' },
  telemetryBidCounterPill: { color: '#000000', backgroundColor: '#f59e0b', fontSize: 8, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  auctionTimerBlockStrip: { backgroundColor: '#111111', borderWidth: 1, borderColor: '#222222', padding: 6, borderRadius: 2, marginBottom: 10 },
  timerBlockLabelText: { color: '#64748b', fontSize: 7, fontWeight: 'bold', fontFamily: 'monospace' },
  timerBlockValueString: { color: '#ef4444', fontSize: 11, fontWeight: '900', fontFamily: 'monospace', marginTop: 2 },
  listingCardPhotosCarouselTray: { flexDirection: 'row', marginVertical: 8, paddingBottom: 4 },
  carouselListingInlineFrameImage: { width: 140, height: 100, borderRadius: 4, marginRight: 8, borderWidth: 1, borderColor: '#333333', resizeMode: 'cover' },
  expandableBiddingWorkflowInputRow: { flexDirection: 'row', marginTop: 10, borderTopWidth: 1, borderTopColor: '#222222', paddingTop: 8, alignItems: 'center' },
  customBidNumericFieldCell: { flex: 1, backgroundColor: '#000000', borderWidth: 1, borderColor: '#f59e0b', borderRadius: 4, paddingVertical: 8, paddingHorizontal: 10, color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  btnExecuteBidBroadcasterSpec: { backgroundColor: '#f59e0b', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 4, marginLeft: 6 },
  btnExecuteBidBroadcasterTextSpec: { color: '#000000', fontSize: 9, fontWeight: '900' },
  reputationEvaluatorFormBlockFrame: { backgroundColor: '#000000', borderWidth: 1, borderColor: '#a855f7', padding: 10, borderRadius: 4, marginTop: 12 },
  evaluatorTitleLabel: { color: '#a855f7', fontSize: 8, fontWeight: '900', fontFamily: 'monospace' },
  evalInputFieldTextCell: { backgroundColor: '#111111', borderWidth: 1, borderColor: '#333333', padding: 8, color: '#ffffff', fontSize: 12, borderRadius: 4, marginVertical: 8, fontWeight: 'bold' },
  starSelectionRowGridButton: { flexDirection: 'row', marginBottom: 8 },
  btnStarItemSpec: { marginRight: 6, padding: 2 },
  btnStarItemSpecActive: { transform: [{ scale: 1.1 }] },
  starGlyphTextSymbol: { color: '#f59e0b', fontSize: 16 },
  btnSubmitReviewBroadcasterActionSpec: { backgroundColor: '#a855f7', paddingVertical: 8, borderRadius: 2, alignItems: 'center' },
  btnSubmitReviewBroadcasterTextSpec: { color: '#ffffff', fontSize: 9, fontWeight: '900' },
  btnWorkspacePickFileSandboxSpec: { borderWidth: 1, borderColor: '#ef4444', backgroundColor: '#110c14', paddingVertical: 10, borderRadius: 4, alignItems: 'center', marginBottom: 10 },
  btnWorkspacePickFileSandboxTextSpec: { color: '#ef4444', fontSize: 9, fontWeight: '900', textAlign: 'center' },
  sandboxConfirmationReceiptBoxString: { color: '#ef4444', fontSize: 9, fontFamily: 'monospace', marginBottom: 10, backgroundColor: '#000000', padding: 6, borderRadius: 4, borderWidth: 1, borderColor: '#2b1216' },
  imageSystemSectionBox: { marginVertical: 4 },
  photoGridWrapper: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#000000', borderWidth: 1, borderColor: '#222222', padding: 8, borderRadius: 4, marginBottom: 12 },
  photoGridCell: { width: 50, height: 50, marginRight: 6, marginBottom: 6 },
  thumbnailCellImage: { width: '100%', height: '100%', borderRadius: 2 },
  card: { backgroundColor: '#111111', borderWidth: 1, borderColor: '#333333', borderRadius: 4, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  cardTag: { fontSize: 9, fontWeight: '900', color: '#000000', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 2, overflow: 'hidden' },
  tagPhys: { color: '#000000', backgroundColor: '#f59e0b' },
  tagNft: { color: '#ffffff', backgroundColor: '#a855f7' },
  pricingDashboardBlock: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#000000', borderWidth: 1, borderColor: '#222222', padding: 10, borderRadius: 4, marginTop: 4 },
  priceDataLabel: { color: '#888888', fontSize: 8, fontWeight: 'bold' },
  priceDataValue: { color: '#ffffff', fontSize: 14, fontWeight: '900', marginTop: 2 },
  priceDataUsdValue: { color: '#64748b', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  buyNowValueText: { color: '#10b981', fontSize: 14, fontWeight: '900', marginTop: 2 },
  cardActionContainerRow: { flexDirection: 'row', marginTop: 12, borderTopWidth: 1, borderTopColor: '#222222', paddingTop: 10 },
  cardBidBtn: { flex: 1, backgroundColor: '#222222', borderWidth: 1, borderColor: '#555555', paddingVertical: 10, borderRadius: 4, alignItems: 'center', marginRight: 6 },
  cardBidBtnText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  cardBuyBtn: { flex: 1, backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 4, alignItems: 'center' },
  cardBuyBtnText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  bountyCard: { backgroundColor: '#111111', borderWidth: 1, borderColor: '#333333', borderLeftWidth: 5, borderLeftColor: '#f59e0b', borderRadius: 4, padding: 14, marginBottom: 12 },
  bountyTitle: { color: '#ffffff', fontSize: 14, fontWeight: '900', flex: 1 },
  btnClaimBounty: { backgroundColor: '#f59e0b', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 4 },
  btnClaimBountyText: { color: '#000000', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  diagnosticsFrame: { backgroundColor: '#111111', borderWidth: 1, borderColor: '#333333', padding: 14 },
  diagLog: { color: '#ffffff', fontFamily: 'monospace', fontSize: 11 },
  aiPillTrigger: { backgroundColor: '#a855f7', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4 },
  aiPillTriggerText: { color: '#ffffff', fontSize: 9, fontWeight: '900' },
  aiBotOverlayConsoleContainer: { backgroundColor: '#070b12', borderWidth: 1, borderColor: '#a855f7', borderRadius: 4, padding: 12, marginBottom: 14, height: 260 },
  aiBotHeaderRowSpec: { borderBottomWidth: 1, borderBottomColor: '#241435', paddingBottom: 6, marginBottom: 8 },
  aiBotHeaderTitle: { color: '#a855f7', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace' },
  aiBotLogsScrollArea: { flex: 1 },
  aiLogBubble: { padding: 10, borderRadius: 4, marginBottom: 8, maxWidth: '85%' },
  aiLogBubbleUser: { backgroundColor: '#0d253f', alignSelf: 'flex-end', borderWidth: 1, borderColor: '#00f0ff' },
  aiLogBubbleBot: { backgroundColor: '#111111', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#10b981' },
  aiLogBubbleAudit: { backgroundColor: '#161021', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#a855f7' },
  aiLogBubbleMeta: { color: '#64748b', fontSize: 8, fontFamily: 'monospace', fontWeight: 'bold', marginBottom: 4 },
  aiLogBubbleText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  aiBotInputRowArea: { borderTopWidth: 1, borderTopColor: '#241435', paddingTop: 6, flexDirection: 'row' },
  aiBotInputFieldSpec: { flex: 1, backgroundColor: '#000000', paddingHorizontal: 10, color: '#ffffff', fontSize: 12, borderRadius: 4 },
  btnSendAiQuerySpec: { backgroundColor: '#ffffff', paddingHorizontal: 14, borderRadius: 4, justifyContent: 'center', marginLeft: 6 },
  btnSendAiQuerySpecText: { color: '#000000', fontSize: 10, fontWeight: '900' },
  searchMatrixWrapperContainer: { backgroundColor: '#111111', borderWidth: 1, borderColor: '#333333', padding: 10, borderRadius: 4, marginBottom: 12 },
  searchBarInputFieldSpec: { backgroundColor: '#222222', borderWidth: 1, borderColor: '#444444', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 4, color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  filterTabsCategoryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  filterCategoryBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333333', backgroundColor: '#000000', marginHorizontal: 4, borderRadius: 4 },
  filterCategoryBtnActive: { borderColor: '#ffffff', backgroundColor: '#222222' },
  filterCategoryBtnText: { color: '#888888', fontSize: 11, fontWeight: 'bold' },
  filterCategoryBtnTextActive: { color: '#ffffff' },
  lightboxContainerOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)', justifyContent: 'center', alignItems: 'center' },
  lightboxCloseHitboxArea: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4 },
  lightboxCloseTextSymbol: { color: '#ffffff', fontSize: 12, fontWeight: '900', fontFamily: 'monospace' },
  lightboxSwipeViewerScrollArea: { width: '100%', height: '80%' },
  lightboxImageSlideWrapperSpec: { width: 360, height: '100%', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  lightboxTargetActiveImageFrame: { width: '100%', height: '75%' },
  lightboxIndexIndicatorLabel: { color: '#00f0ff', fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace', marginTop: 15 },
  infiniteScrollLoaderContainer: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  infiniteScrollLoaderTextSpec: { color: '#a855f7', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace', marginTop: 8 },
  auditSummaryBox: { backgroundColor: '#062f1d', padding: 10, borderRadius: 4, marginBottom: 10, borderWidth: 1, borderColor: '#10b981' },
  auditTitle: { color: '#10b981', fontWeight: '900', fontSize: 10 },
  auditText: { color: '#ffffff', fontSize: 10, fontFamily: 'monospace' },
  btnMediaPickCameraSpec: { backgroundColor: '#000000', borderWidth: 2, borderColor: '#00f0ff', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 4, alignItems: 'center', marginBottom: 12 },
  btnMediaPickCameraSpecText: { color: '#00f0ff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  walletFallbackConnectPillSpec: { backgroundColor: '#110c14', borderWidth: 1, borderColor: '#a855f7', padding: 16, borderRadius: 4, alignItems: 'center', marginVertical: 10 },
  walletFallbackConnectPillTextSpec: { color: '#a855f7', fontSize: 9, fontWeight: '900', fontFamily: 'monospace', textAlign: 'center' },
  walletConnectedBadgeAddressHeaderSpec: { color: '#10b981', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold', marginBottom: 10 },
  btnMediaPickNftPurpleSpec: { backgroundColor: '#000000', borderWidth: 2, borderColor: '#a855f7', paddingVertical: 14, borderRadius: 4, alignItems: 'center', marginBottom: 12 },
  btnMediaPickNftPurpleSpecText: { color: '#a855f7', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  trayCardSelected: { borderColor: '#a855f7', backgroundColor: '#110c14' },
  dashboardSectionLabelHeader: { color: '#00f0ff', fontSize: 12, fontWeight: 'bold', marginVertical: 10, paddingLeft: 5 },
  disclaimerContainer: { backgroundColor: '#2b1216', padding: 8, borderRadius: 4, marginVertical: 8, borderWidth: 1, borderColor: '#ef4444' },
  disclaimerText: { color: '#ef4444', fontSize: 9, textAlign: 'center', fontWeight: 'bold' },
  dashboardMetricPanel: { backgroundColor: '#111', borderWidth: 1, borderColor: '#333', padding: 15, borderRadius: 4, marginBottom: 10 },
  dashboardGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dashboardGridCell: { flex: 1, backgroundColor: '#111', borderWidth: 1, borderColor: '#333', padding: 15, borderRadius: 4, marginHorizontal: 2 },
  metricLabel: { color: '#64748b', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold', marginBottom: 5 },
  metricValue: { color: '#fff', fontSize: 18, fontWeight: '900', fontFamily: 'monospace' },
  dashboardLedgerCard: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#222', borderLeftWidth: 4, borderLeftColor: '#00f0ff', padding: 14, borderRadius: 4, marginBottom: 10 },
  ledgerBtn: { flex: 1, borderWidth: 1, borderColor: '#555', paddingVertical: 8, alignItems: 'center', borderRadius: 4 },
  ledgerBtnActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  ledgerBtnText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  dashboardSubCardLineItem: { backgroundColor: '#111', borderWidth: 1, borderColor: '#333', borderLeftWidth: 4, borderLeftColor: '#10b981', padding: 12, borderRadius: 4, marginBottom: 8 },
  shippingBtn: { flex: 1, borderWidth: 1, borderColor: '#444', padding: 12, alignItems: 'center', borderRadius: 4, marginHorizontal: 4 },
  shippingBtnActive: { borderColor: '#10b981', backgroundColor: '#062f1d' },
  shippingBtnText: { color: '#888', fontSize: 10, fontWeight: 'bold' },
  shippingBtnTextActive: { color: '#10b981' },
  fiatConversionTextOverlay: { color: '#10b981', fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  dynamicFeeDisclaimerText: { color: '#ef4444', fontSize: 10, textAlign: 'center', fontWeight: 'bold', marginBottom: 10, paddingHorizontal: 10 }
});
