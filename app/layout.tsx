'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './globals.css'; 

// 1. Core Web3 Gateway Configuration for Base Mainnet & Sepolia Testnet Indices
const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected(), 
    coinbaseWallet({ appName: 'BaseVault Market' }), 
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

// 2. State Cache Instance Engine for Web3 Async Data Pipelines
const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0c101b]">
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}