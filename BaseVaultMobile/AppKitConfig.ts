import '@walletconnect/react-native-compat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAppKit } from '@reown/appkit-react-native';
import { WagmiAdapter } from '@reown/appkit-wagmi-react-native';
import { base } from 'wagmi/chains';

const projectId = '76e2c3bdcf7f79ff05118f62f3ab3b3b'; 

const metadata = {
  name: 'BaseVault Market Mobile',
  description: 'Decentralized P2P Escrow & AI Appraisal Marketplace',
  url: 'https://basevaultmarket.com',
  icons: ['https://basevaultmarket.com/favicon.ico'],
  redirect: {
    native: 'basevaultmobile://',
    universal: 'https://basevaultmarket.com'
  }
};

const appNetworks = [base];

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: appNetworks
});

export const initializeAppKitEngine = () => {
  return createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: appNetworks,
    metadata,
    themeMode: 'dark',
    features: { analytics: false, swaps: true, onramp: true },
    storage: AsyncStorage 
  });
};
