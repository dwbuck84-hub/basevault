import '@walletconnect/react-native-compat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WagmiAdapter } from '@reown/appkit-wagmi-react-native';
import { base } from 'wagmi/chains';

export const projectId = '76e2c3bdcf7f79ff05118f62f3ab3b3b';

export const metadata = {
  name: 'BaseVault Market Mobile',
  description: 'Decentralized P2P Escrow & AI Appraisal Marketplace',
  url: 'https://basevaultmarket.com',
  icons: ['https://basevaultmarket.com/favicon.ico'],
  redirect: {
    native: 'basevaultmobile://',
    universal: 'https://basevaultmarket.com'
  }
};

export const chains = [base];

// 🔥 TRUE REOWN WAY: Instantiate the pure pluggable adapter layout directly
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: chains
});
