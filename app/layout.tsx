import './globals.css';
import { Providers } from './providers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BaseVault Market',
  description: 'Decentralized Asset Escrow on Base',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0f1d] text-slate-100 font-mono m-0 p-0">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
