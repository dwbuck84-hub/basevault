'use client';

import type { WidgetConfig, WidgetFeeConfig } from '@lifi/widget';
import { LiFiWidget } from '@lifi/widget';

// 1. Programmatic Skinner Setup (0.2% Fee Configuration)
const FEE_SYSTEM_CONFIG: WidgetFeeConfig = {
  name: "BaseVault Protocol Fee",
  fee: 0.002, // Strips exactly 0.2% from the source token upon bridge execution
  showFeePercentage: true,
  showFeeTooltip: true
};

const PORTAL_CONFIG: WidgetConfig = {
  // 2. Core Master Integrator Key (Lower-case registration match)
  integrator: 'basevault', 
  
  // 3. Activating Fee Parameters
  feeConfig: FEE_SYSTEM_CONFIG,

  // 4. Hardening Dashboard Cyber-Aesthetics
  appearance: 'dark',
  variant: 'compact',
  theme: {
    container: {
      border: '1px solid #00f0ff', // Vivid Neon Cyan Framing
      borderRadius: '12px',
      boxShadow: '0px 0px 20px rgba(0, 240, 255, 0.15)',
    },
    palette: {
      background: {
        default: '#070a13', // Deep Shadow Background Layer
        paper: '#0d1324',   // Core Input Modules
      },
      primary: {
        main: '#00f0ff',    // Neon Cyan Focal Tones
      },
      secondary: {
        main: '#00ff87',    // Emerald Green Telemetry Highlights
      },
    },
  },

  // 5. Clamping the Exit Route to Native Base ETH
  toChain: 8453, // Base Network ID
  toToken: '0x0000000000000000000000000000000000000000', // Native Layer ETH Address

  // 6. Trimming UI Elements
  hiddenUI: ['appearance', 'language'],
};

export default function LifiPortal() {
  return (
    <div className="w-full max-w-[420px] mx-auto p-2 bg-[#05070f] rounded-xl border border-slate-900">
      {/* Network Processing Status Monitor */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-900 mb-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <p className="text-xs font-mono tracking-widest text-cyan-400 uppercase">
            Liquidity Node Alpha
          </p>
        </div>
        <p className="text-[10px] font-mono text-slate-500">Base-Router v2.1-Fee</p>
      </div>
      
      <LiFiWidget config={PORTAL_CONFIG} integrator="basevault" />
    </div>
  );
}
