'use client';

// ⚡ Force dynamic execution to bypass static prerendering build crashes
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

// 📡 Safe Initialize Supabase Client with static build-time fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qwuurofqumhoiikumxlg.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_LPouw16DZly6LqleGNFp-Q_sbx3JD-B";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 🛠️ Extend Global Window Interface for TypeScript Compiler
declare global {
  interface Window {
    ethereum?: any;
  }
}

// 📜 Smart Contract Topology 
const CONTRACT_ADDRESS = "0x6eD3E30FC82B361cACaC98C46C3Ae19C99fe05A8";
const CONTRACT_ABI = [
  "function gigs(uint256) view returns (uint256 id, address buyer, address seller, uint256 amount, string trackingNumber, uint256 trackingSubmittedAt, bool isDisputed, uint8 status)",
  "function submitTracking(uint256 _gigId, string calldata _trackingNumber) external",
  "function releaseEscrowFunds(uint256 _gigId) external",
  "function toggleDispute(uint256 _gigId) external",
  "function claimExpiredEscrow(uint256 _gigId) external"
];

export default function Home() {
  // Hardcoded default for home root workspace simulation view
  const gigId = 12; 
  
  // App States
  const [loading, setLoading] = useState<boolean>(true);
  const [userWallet, setUserWallet] = useState<string>("");
  const [userRole, setUserRole] = useState<'buyer' | 'seller' | 'none'>('none');
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const [trackingInput, setTrackingInput] = useState<string>("");
  
  // Escrow Struct Mirror State
  const [escrow, setEscrow] = useState<{
    buyer: string;
    seller: string;
    amount: string;
    trackingNumber: string;
    trackingSubmittedAt: number;
    isDisputed: boolean;
    status: number; // 0: Active, 1: Shipped, 2: Disputed, 3: Settled, 4: Refunded
  } | null>(null);

  useEffect(() => {
    connectAndLoadData();
  }, [gigId]);

  // 🛠️ Step 1: Connect Wallet & Run Behavioral Health Checks against Supabase
  const connectAndLoadData = async () => {
    try {
      if (!window.ethereum) return alert("Please install a Web3 wallet extension.");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const walletAddress = (await signer.getAddress()).toLowerCase();
      setUserWallet(walletAddress);

      // Fetch user profiling from Supabase to enforce rules
      const { data: profile } = await supabase
        .from('profiles')
        .select('times_ghosted_seller, total_disputes_filed')
        .eq('wallet_address', walletAddress)
        .single();

      if (profile && profile.times_ghosted_seller >= 3) {
        setIsSuspended(true);
        setLoading(false);
        return;
      }

      // Fetch On-Chain State Parameters
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const chainData = await contract.gigs(gigId);
      
      const mappedEscrow = {
        buyer: chainData.buyer.toLowerCase(),
        seller: chainData.seller.toLowerCase(),
        amount: ethers.formatEther(chainData.amount),
        trackingNumber: chainData.trackingNumber,
        trackingSubmittedAt: Number(chainData.trackingSubmittedAt),
        isDisputed: chainData.isDisputed,
        status: Number(chainData.status)
      };

      setEscrow(mappedEscrow);

      if (walletAddress === mappedEscrow.buyer) setUserRole('buyer');
      else if (walletAddress === mappedEscrow.seller) setUserRole('seller');

      setLoading(false);
    } catch (err) {
      console.error("Error setting up workspace pipeline:", err);
      setLoading(false);
    }
  };

  // 📤 Seller Action: Submit Tracking & Update Timestamps
  const handleTrackingSubmission = async () => {
    if (!trackingInput) return alert("Please type a valid tracking number.");
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.submitTracking(gigId, trackingInput);
      await tx.wait();

      // Log to Supabase Chat Thread as system message
      await supabase.from('marketplace_chats').insert({
        gig_id: gigId,
        sender: 'system',
        message: `System Alert: Seller has shipped the physical item. Tracking ID entered: ${trackingInput}. The 14-day resolution clock has been initialized.`
      });

      alert("Tracking successfully written to the blockchain sequencer.");
      connectAndLoadData();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // 🔓 Buyer Action: Release Funds Manually
  const handleManualRelease = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.releaseEscrowFunds(gigId);
      await tx.wait();

      alert("Funds successfully disbursed (96% to seller / 4% platform fee split completed).");
      connectAndLoadData();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // 🚨 Buyer Action: Freeze the Countdown Clock (File Dispute)
  const handleToggleDispute = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.toggleDispute(gigId);
      await tx.wait();

      // Fetch buyer profile metrics to increment their total disputes filed count in Supabase
      const { data: profile } = await supabase.from('profiles').select('total_disputes_filed').eq('wallet_address', userWallet).single();
      await supabase.from('profiles').update({ total_disputes_filed: (profile?.total_disputes_filed || 0) + 1 }).eq('wallet_address', userWallet);

      // Flag the live chat thread for administrative attention
      await supabase.from('marketplace_chats').insert({
        gig_id: gigId,
        sender: 'system',
        message: "🚨 CRITICAL DISPUTE FILED: The escrow clock has been locked by the buyer. Photo evidence tools are now unrestricted. Admin team notified."
      });

      alert("Dispute registered. Escrow timeline successfully frozen.");
      connectAndLoadData();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // ⏳ Seller Action: Claim Funds after 14-day silence
  const handleClaimExpiredEscrow = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.claimExpiredEscrow(gigId);
      await tx.wait();

      // Penalty Module: Increment the buyer's ghosted behavior score metric in Supabase
      const { data: profile } = await supabase.from('profiles').select('times_ghosted_seller').eq('wallet_address', escrow!.buyer).single();
      await supabase.from('profiles').update({ times_ghosted_seller: (profile?.times_ghosted_seller || 0) + 1 }).eq('wallet_address', escrow!.buyer);

      alert("14-Day window complete. Funds safely extracted autonomously.");
      connectAndLoadData();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Calculate Remaining Time-Lock
  const getRemainingTime = () => {
    if (!escrow || escrow.trackingSubmittedAt === 0) return 0;
    const expirationTime = (escrow.trackingSubmittedAt + (14 * 24 * 60 * 60)) * 1000; // 14 days in ms
    const diff = expirationTime - Date.now();
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  };

  if (loading) return <div className="text-center p-12 font-mono text-cyan-400">Syncing BaseVault Escrow Streams...</div>;
  
  if (isSuspended) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-red-950/80 border border-red-500 rounded-lg p-8 font-mono text-center">
        <h1 className="text-2xl font-black text-red-500 mb-4">🚨 ACCESS DENIED</h1>
        <p className="text-red-200 text-sm leading-relaxed">
          Your public wallet address has been flagged and suspended for repeated escrow violations (habitual failure to report received items or frivolous dispute filing).
        </p>
      </div>
    );
  }

  if (!escrow) return <div className="text-center font-mono text-red-400">Vault position not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 font-mono bg-black text-white selection:bg-cyan-500 min-h-screen">
      {/* Header Matrix */}
      <div className="border-b border-zinc-800 pb-4 mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-400">VAULT_STATION // ITEM_ID #{gigId}</h1>
        <p className="text-xs text-zinc-600 mt-1">Contract Deployment: {CONTRACT_ADDRESS}</p>
      </div>

      {/* Warning Banners Section */}
      {userRole === 'buyer' && escrow.status === 1 && (
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-lg p-4 mb-6 text-amber-200 text-xs">
          <div className="font-bold text-amber-400 mb-1">⚠️ ESCROW ETIQUETTE RULE WARNING</div>
          <p className="mb-2">The seller uploaded tracking. You have <span className="font-bold text-white text-sm">{getRemainingTime()} days</span> left to confirm receipt or file a dispute before automated payout occurs.</p>
          <span className="text-zinc-400">Notice: Habitual failure to confirm received items causes account lockout parameters to toggle.</span>
        </div>
      )}

      {userRole === 'seller' && escrow.status === 0 && (
        <div className="bg-blue-950/40 border border-blue-500/50 rounded-lg p-4 mb-6 text-blue-200 text-xs">
          <div className="font-bold text-blue-400 mb-1">ℹ️ PACKAGING LOGISTICS INFO</div>
          <p>Please drop off the item at your local shipping carrier and input the tracking number below to initialize your 14-day claim window countdown.</p>
        </div>
      )}

      {/* Transaction Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="space-y-3 text-sm">
          <div><span className="text-zinc-500">Vault Deposit:</span> <span className="text-emerald-400 font-bold">{escrow.amount} ETH</span></div>
          <div><span className="text-zinc-500">Buyer Wallet:</span> <span className="text-xs text-zinc-300">{escrow.buyer}</span></div>
          <div><span className="text-zinc-500">Seller Wallet:</span> <span className="text-xs text-zinc-300">{escrow.seller}</span></div>
        </div>

        <div className="space-y-3 text-sm border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6">
          <div>
            <span className="text-zinc-500">Escrow Status:</span>{' '}
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              escrow.status === 0 ? "bg-zinc-800 text-zinc-300" :
              escrow.status === 1 ? "bg-amber-500/20 text-amber-400" :
              escrow.status === 2 ? "bg-red-500/20 text-red-400 animate-pulse" :
              "bg-emerald-500/20 text-emerald-400"
            }`}>
              {["ACTIVE_ESCROW", "SHIPPED", "DISPUTED", "SETTLED_SUCCESS", "REFUNDED"][escrow.status]}
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Tracking Code:</span>{' '}
            <span className="text-cyan-400 font-bold">{escrow.trackingNumber || "AWAITING_SHIPMENT"}</span>
          </div>
        </div>
      </div>

      {/* Core Operational Control Panels */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-bold text-zinc-400 mb-4 tracking-widest">// CONTRACT_CONTROL_ACTIONS</h3>
        
        {/* Seller UI Commands */}
        {userRole === 'seller' && (
          <div className="space-y-4">
            {escrow.status === 0 && (
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  placeholder="Enter Shipping Tracking Code"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  className="flex-1 bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-cyan-400 focus:outline-none focus:border-cyan-500"
                />
                <button onClick={handleTrackingSubmission} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-6 py-2 rounded text-sm transition-colors">
                  Submit Tracking
                </button>
              </div>
            )}

            {escrow.status === 1 && (
              <div>
                {getRemainingTime() === 0 ? (
                  <button onClick={handleClaimExpiredEscrow} className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-3 rounded text-sm transition-colors">
                    Claim Expired Escrow Funds (Autonomy Mode)
                  </button>
                ) : (
                  <div className="text-center text-zinc-500 text-xs py-2 bg-zinc-900 rounded border border-zinc-800">
                    🔒 Time-lock window active. Automated payout opens in <span className="text-amber-400 font-bold">{getRemainingTime()} days</span> if no dispute is flagged.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Buyer UI Commands */}
        {userRole === 'buyer' && (
          <div className="space-y-4">
            {(escrow.status === 0 || escrow.status === 1) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={handleManualRelease} className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-3 rounded text-sm transition-colors">
                  Confirm Receipt & Release Funds
                </button>
                {escrow.status === 1 && (
                  <button onClick={handleToggleDispute} className="bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 font-bold py-3 rounded text-sm transition-colors">
                    🚨 Open Dispute / Freeze Clock
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Guest View / Inactive */}
        {userRole === 'none' && (
          <p className="text-xs text-zinc-600 text-center py-4">Your current address profile context acts as a read-only witness observer to this escrow arrangement.</p>
        )}
      </div>
    </div>
  );
}