'use client';
import React, { useState } from 'react';

interface AppraiserProps {
  onDeployListing: (title: string, priceEth: string, desc: string, category: string) => Promise<void>;
  ethUsdRate: number;
}

export default function IntegratedAiAppraiser({ onDeployListing, ethUsdRate }: AppraiserProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verificationImage, setVerificationImage] = useState<string | null>(null);
  
  const [appraisalData, setAppraisalData] = useState<{
    identifiedItemName: string;
    marketUsdValue: number;
    pricingStrategies: { fastLiquidateEth: number; fairMarketEth: number; premiumChoiceEth: number };
    authenticityMetrics: { isStockOrInternetPhoto: boolean; detectedConditionScore: string };
  } | null>(null);

  const [finalPrice, setFinalPrice] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setVerificationImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const executeAiAppraisalAndShield = async () => {
    if (!verificationImage) return;
    setLoading(true);

    try {
      const res = await fetch('/api/listings/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: verificationImage })
      });
      const json = await res.json();

      if (json.success) {
        setAppraisalData(json.data);
        setTitle(json.data.identifiedItemName);
        setDescription(`Automated condition scan verified as ${json.data.authenticityMetrics.detectedConditionScore}. Assessed via BaseVault AI platform protocols.`);
        setFinalPrice(json.data.pricingStrategies.fairMarketEth.toString());
        setStep(2);
      }
    } catch (err) {
      console.error("Appraisal engine calculation failure:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    await onDeployListing(title, finalPrice, description, "AI Evaluated Asset");
    setStep(1);
    setVerificationImage(null);
    setAppraisalData(null);
  };

  return (
    <div className="w-full bg-[#10172a] border border-slate-800 p-5 rounded-lg text-white font-mono">
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-cyan-950/20 border border-cyan-500/20 p-4 rounded">
            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest">// AUTOMATED AI ASSISTANT & SELLER SHIELD</h3>
            <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed font-sans">
              Upload an organic snapshot of your physical item or collector card. Our network vision node automatically identifies your asset and converts secondary-market valuations into optimized live ETH pricing choices.
            </p>
          </div>

          <label className="border-2 border-dashed border-slate-800 hover:border-cyan-500/40 rounded h-32 flex flex-col justify-center items-center cursor-pointer bg-slate-950/50 text-xs text-slate-500 transition-colors">
            <span>{verificationImage ? "✅ IMAGE BUFFER READY" : "SNAP OR UPLOAD PHYSICAL ITEM SNAPSHOT"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>

          {verificationImage && (
            <button
              onClick={executeAiAppraisalAndShield}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-400 to-cyan-500 text-black font-black py-3 rounded text-xs uppercase tracking-wider"
            >
              {loading ? 'SYNCHRONIZING TELEMETRY ENGINE...' : 'EXECUTE SHIELD ASSESSMENT'}
            </button>
          )}
        </div>
      )}

      {step === 2 && appraisalData && (
        <div className="space-y-4 text-xs animate-in fade-in duration-200">
          <div>
            <label className="text-[9px] text-slate-500 uppercase font-black">AI System Asset Identification</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-cyan-400 text-xs mt-1 uppercase" />
          </div>

          <div>
            <label className="text-[9px] text-slate-500 uppercase font-black block mb-2">Select Live Index Pricing Strategy (ETH)</label>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setFinalPrice(appraisalData.pricingStrategies.fastLiquidateEth.toString())} className={`p-2 border rounded text-left text-zinc-300 transition-all ${finalPrice === appraisalData.pricingStrategies.fastLiquidateEth.toString() ? 'border-cyan-500 bg-cyan-950/40' : 'border-slate-800 bg-slate-950'}`}>
                <div className="text-[8px] text-amber-400 font-bold">⚡ LIQUIDATE</div>
                <div className="font-bold mt-0.5">{appraisalData.pricingStrategies.fastLiquidateEth}</div>
              </button>
              <button onClick={() => setFinalPrice(appraisalData.pricingStrategies.fairMarketEth.toString())} className={`p-2 border rounded text-left text-zinc-300 transition-all ${finalPrice === appraisalData.pricingStrategies.fairMarketEth.toString() ? 'border-emerald-500 bg-emerald-950/40' : 'border-slate-800 bg-slate-950'}`}>
                <div className="text-[8px] text-emerald-400 font-bold">⚖️ FAIR FLOOR</div>
                <div className="font-bold mt-0.5">{appraisalData.pricingStrategies.fairMarketEth}</div>
              </button>
              <button onClick={() => setFinalPrice(appraisalData.pricingStrategies.premiumChoiceEth.toString())} className={`p-2 border rounded text-left text-zinc-300 transition-all ${finalPrice === appraisalData.pricingStrategies.premiumChoiceEth.toString() ? 'border-purple-500 bg-purple-950/40' : 'border-slate-800 bg-slate-950'}`}>
                <div className="text-[8px] text-purple-400 font-bold">💎 PREMIUM</div>
                <div className="font-bold mt-0.5">{appraisalData.pricingStrategies.premiumChoiceEth}</div>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 border border-slate-800 rounded flex justify-between items-center text-[10px]">
            <div>
              <span className="text-slate-500">Condition Rating:</span>
              <span className="ml-1 text-cyan-400 font-bold uppercase">{appraisalData.authenticityMetrics.detectedConditionScore}</span>
            </div>
            {appraisalData.authenticityMetrics.isStockOrInternetPhoto && (
              <span className="bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 text-[8px] font-black uppercase">Stock Footprint Detected</span>
            )}
          </div>

          <div>
            <label className="text-[9px] text-slate-500 uppercase font-black">Target Ledger Cost (ETH)</label>
            <input type="number" step="0.0001" value={finalPrice} onChange={e => setFinalPrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-white font-mono text-xs mt-1" />
          </div>

          <button onClick={handleFinalSubmit} className="w-full bg-gradient-to-r from-emerald-400 to-cyan-500 text-black font-black py-3 rounded text-xs uppercase tracking-wider">
            Deploy Smart Escrow Protected Contract
          </button>
        </div>
      )}
    </div>
  );
}
