'use client';

import dynamic from 'next/dynamic';

// Force client isolation safely away from server pre-compilation steps
const LifiPortal = dynamic(
  () => import('@/components/LifiPortal'),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[480px] w-full max-w-[420px] bg-[#070a13] border border-cyan-950/40 rounded-2xl flex items-center justify-center font-mono text-xs text-cyan-500 tracking-widest uppercase p-6 text-center animate-pulse shadow-[0_0_30px_rgba(0,240,255,0.02)]">
        INITIALIZING LIQUIDITY TRANSIT NODE...
      </div>
    )
  }
);

export default function PortalPage() {
  return (
    <div className="min-h-screen w-full bg-[#03050a] text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden selection:bg-cyan-500/20">
      {/* Structural Ambient Mesh Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff03_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff03_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <div className="w-full max-w-[420px] relative z-10 flex flex-col gap-4">
        {/* Subtle Breadcrumb Navigation Return Anchor */}
        <a 
          href="/" 
          className="font-mono text-[10px] uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors duration-200 flex items-center gap-1.5 px-1 self-start group"
        >
          <span className="transform group-hover:-translate-x-0.5 transition-transform">←</span> Return to BaseVault Matrix
        </a>

        {/* The Isolated Widget Terminal */}
        <LifiPortal />
      </div>
    </div>
  );
}
