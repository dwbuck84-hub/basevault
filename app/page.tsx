'use client';

import { useState, useEffect } from 'react';

export default function BaseVaultEngine() {
  const [activeTab, setActiveTab] = useState<'registry' | 'deploy' | 'telemetry' | 'legal'>('deploy');
  const [assetType, setAssetType] = useState<'bounty' | 'physical' | 'nft'>('physical');
  const [formatType, setFormatType] = useState<'auction' | 'fixed'>('fixed');
  const [auctionDuration, setAuctionDuration] = useState('7');

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-mono">
      <nav className="border-b border-zinc-800 bg-black/90 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="bg-emerald-600 text-black px-4 py-1.5 rounded font-bold text-sm">BRIDGE</div>
            <div className="flex gap-8 text-sm font-medium">
              <button onClick={() => setActiveTab('registry')} className={activeTab === 'registry' ? "text-emerald-400" : "text-zinc-400 hover:text-white"}>Registry</button>
              <button onClick={() => setActiveTab('deploy')} className={activeTab === 'deploy' ? "text-emerald-400" : "text-zinc-400 hover:text-white"}>Deploy Node</button>
              <button onClick={() => setActiveTab('telemetry')} className={activeTab === 'telemetry' ? "text-emerald-400" : "text-zinc-400 hover:text-white"}>Telemetry</button>
              <button onClick={() => setActiveTab('legal')} className={activeTab === 'legal' ? "text-red-400" : "text-zinc-400 hover:text-white"}>Legal Guard</button>
            </div>
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded text-sm font-bold">CONNECT</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-8">
        <h1 className="text-5xl font-bold text-center mb-1">BASEVAULT ENGINE V5</h1>
        <p className="text-center text-emerald-400 mb-12">Matrix Terminal • Operational</p>

        {activeTab === 'deploy' && (
          <div className="bg-zinc-900 border border-zinc-700 p-10 rounded-3xl">
            <h2 className="text-4xl font-bold mb-10">DEPLOY V5 NODE</h2>

            <div className="flex gap-3 mb-10">
              <button onClick={() => setAssetType('bounty')} className={`flex-1 py-5 rounded-2xl ${assetType === 'bounty' ? 'bg-blue-600' : 'bg-zinc-800'}`}>BOUNTY</button>
              <button onClick={() => setAssetType('physical')} className={`flex-1 py-5 rounded-2xl ${assetType === 'physical' ? 'bg-emerald-600' : 'bg-zinc-800'}`}>PHYSICAL</button>
              <button onClick={() => setAssetType('nft')} className={`flex-1 py-5 rounded-2xl ${assetType === 'nft' ? 'bg-purple-600' : 'bg-zinc-800'}`}>NFT ASSET</button>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-sm mb-3">SYSTEM TITLE</label>
                <input type="text" className="w-full bg-black border border-zinc-700 p-5 rounded-2xl" placeholder="Enter title..." />
              </div>

              <div>
                <label className="block text-sm mb-3">DOMAIN CATEGORY</label>
                <select className="w-full bg-black border border-zinc-700 p-5 rounded-2xl">
                  <option>Software Development</option>
                  <option>Electronics & Hardware</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-3">FORMAT ARCHITECTURE</label>
                <div className="flex gap-4">
                  <button onClick={() => setFormatType('auction')} className={`flex-1 py-5 rounded-2xl border ${formatType === 'auction' ? 'border-emerald-500 bg-emerald-950' : 'border-zinc-700'}`}>OPEN AUCTION</button>
                  <button onClick={() => setFormatType('fixed')} className={`flex-1 py-5 rounded-2xl border ${formatType === 'fixed' ? 'border-emerald-500 bg-emerald-950' : 'border-zinc-700'}`}>FIXED PRICE / BUY NOW</button>
                </div>
              </div>

              {(assetType === 'physical' || assetType === 'nft') && formatType === 'auction' && (
                <div>
                  <label className="block text-sm mb-3">AUCTION TIME LIMIT</label>
                  <select value={auctionDuration} onChange={e => setAuctionDuration(e.target.value)} className="w-full bg-black border border-zinc-700 p-5 rounded-2xl">
                    <option value="1">1 Day</option>
                    <option value="3">3 Days</option>
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                    <option value="30">30 Days</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm mb-3">SPECIFICATIONS DESCRIPTION</label>
                <textarea className="w-full h-40 bg-black border border-zinc-700 p-5 rounded-2xl" placeholder="Describe your asset..." />
              </div>

              {assetType === 'physical' && (
                <div className="flex items-center justify-between bg-zinc-950 p-5 rounded-2xl">
                  <span>PREMIUM SHIPPING TOGGLE</span>
                  <input type="checkbox" className="w-12 h-6 accent-emerald-500" />
                </div>
              )}

              {assetType === 'nft' && (
                <div className="bg-zinc-950 p-6 rounded-2xl space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2">HEX_CONTRACT (0x...)</label>
                      <input type="text" className="w-full bg-black border border-zinc-700 p-4 rounded-xl" placeholder="0x..." />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">TOKEN_ID</label>
                      <input type="text" className="w-full bg-black border border-zinc-700 p-4 rounded-xl" placeholder="Token ID" />
                    </div>
                  </div>
                  <button className="w-full bg-emerald-600 py-4 rounded-2xl font-bold">RUN OWNERSHIP LOGIC</button>
                </div>
              )}

              <div>
                <label className="block text-sm mb-3">FIXED LIST PRICE</label>
                <input type="number" className="w-full bg-black border border-zinc-700 p-5 rounded-2xl" placeholder="0.00" />
              </div>

              <div>
                <label className="block text-sm mb-3">SETTLEMENT CURRENCY</label>
                <select className="w-full bg-black border border-zinc-700 p-5 rounded-2xl">
                  <option>ETH (Native Gas Asset)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-3">UPLOAD VERIFICATION VISUALS / REFERENCES</label>
                <button className="bg-zinc-800 hover:bg-zinc-700 px-8 py-4 rounded-2xl">Choose Files</button>
              </div>

              <div className="pt-6 border-t border-zinc-700 flex justify-between items-center">
                <div>
                  <span className="text-sm text-zinc-400">PROGRAMMATIC ENTRY FEE:</span>
                  <span className="text-emerald-400 ml-3 font-bold">0.0015 ETH</span>
                </div>
                <button className="bg-gradient-to-r from-cyan-500 to-emerald-500 px-16 py-5 rounded-2xl text-xl font-bold">LAUNCH SYSTEM ASSET</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'registry' && <div className="text-center text-3xl p-20">Registry Tab</div>}
        {activeTab === 'telemetry' && <div className="text-center text-3xl p-20">Telemetry Tab</div>}
        {activeTab === 'legal' && <div className="text-center text-3xl p-20">Legal Guard Tab</div>}
      </div>
    </div>
  );
}
