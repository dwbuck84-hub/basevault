'use client';

import { useState } from 'react';

export default function BaseVaultClean() {
  const [activeTab, setActiveTab] = useState('deploy');
  const [assetType, setAssetType] = useState('physical');
  const [formatType, setFormatType] = useState('fixed');
  const [auctionDays, setAuctionDays] = useState('7');

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-mono">
      <nav className="border-b border-zinc-800 bg-black/90 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="bg-emerald-600 text-black px-4 py-1.5 rounded font-bold text-sm">BRIDGE</div>
            <div className="flex gap-8 text-sm">
              {['Registry', 'Deploy Node', 'Telemetry', 'Legal Guard'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))}
                  className={activeTab === tab.toLowerCase().replace(' ', '') ? "text-emerald-400" : "text-zinc-400 hover:text-white"}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <button className="bg-emerald-600 px-6 py-2 rounded text-sm font-bold">CONNECT</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-8">
        <h1 className="text-5xl font-bold text-center">BASEVAULT ENGINE V5</h1>

        {activeTab === 'deploy' && (
          <div className="bg-zinc-900 border border-zinc-700 p-10 rounded-3xl mt-8">
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
                  <button onClick={() => setFormatType('auction')} className={`flex-1 py-5 rounded-2xl border ${formatType === 'auction' ? 'border-emerald-500' : 'border-zinc-700'}`}>OPEN AUCTION</button>
                  <button onClick={() => setFormatType('fixed')} className={`flex-1 py-5 rounded-2xl border ${formatType === 'fixed' ? 'border-emerald-500' : 'border-zinc-700'}`}>FIXED PRICE</button>
                </div>
              </div>

              {(assetType === 'physical' || assetType === 'nft') && formatType === 'auction' && (
                <div>
                  <label className="block text-sm mb-3">AUCTION TIME LIMIT</label>
                  <select value={auctionDays} onChange={e => setAuctionDays(e.target.value)} className="w-full bg-black border border-zinc-700 p-5 rounded-2xl">
                    <option value="1">1 Day</option>
                    <option value="3">3 Days</option>
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                  </select>
                </div>
              )}

              <button className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 py-5 rounded-2xl text-xl font-bold">LAUNCH SYSTEM ASSET</button>
            </div>
          </div>
        )}

        {activeTab !== 'deploy' && <div className="text-center text-3xl p-20">Tab: {activeTab}</div>}
      </div>
    </div>
  );
}
