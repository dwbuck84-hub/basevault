import dynamic from 'next/dynamic';

// Isolate widget processes safely away from server pre-compiles
const LifiPortal = dynamic(
  () => import('@/components/LifiPortal'),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[480px] w-full max-w-[420px] bg-[#070a13] border border-cyan-950/40 rounded-xl flex items-center justify-center font-mono text-xs text-cyan-500 animate-pulse mx-auto">
        INITIALIZING LIQUIDITY TRANSIT NODE...
      </div>
    )
  }
);

export default function PortalPage() {
  return (
    <main className="min-h-screen bg-[#03050a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Structural Background Cyber Mesh Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      
      <div className="z-10 w-full max-w-md text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 font-mono">
          ⚡ CROSS-CHAIN PORTAL
        </h1>
        <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto font-sans">
          Route liquidity immediately from Arbitrum, Optimism, or Ethereum Mainnet. All transit payloads automatically settle as native Base ETH inside your checkout wallet.
        </p>
      </div>

      <div className="z-10 w-full max-w-md">
        <LifiPortal />
      </div>
    </main>
  );
}
