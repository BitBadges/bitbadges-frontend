import '../styles/custom.css';
import '../styles/index.css';
import '../styles/antd-override-styles.css';

import { configureStore, createSerializableStateInvariantMiddleware } from '@reduxjs/toolkit';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { Button } from 'antd';
import { BitBadgesCollection, BitBadgesUserInfo } from 'bitbadgesjs-sdk';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useCookies } from 'react-cookie';
import { Provider, useDispatch } from 'react-redux';
import { combineReducers } from 'redux';
import thunk from 'redux-thunk';
import type {} from 'redux-thunk/extend-redux';
import { WagmiConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { BrowseContextProvider } from '../bitbadges-api/contexts/BrowseContext';
import { ChainContextProvider } from '../bitbadges-api/contexts/ChainContext';
import { StatusContextProvider } from '../bitbadges-api/contexts/StatusContext';
import { TxTimelineContextProvider } from '../bitbadges-api/contexts/TxTimelineContext';
import { accountReducer } from '../bitbadges-api/contexts/accounts/reducer';
import { BitcoinContextProvider } from '../bitbadges-api/contexts/chains/BitcoinContext';
import { CosmosContextProvider } from '../bitbadges-api/contexts/chains/CosmosContext';
import { EthereumContextProvider } from '../bitbadges-api/contexts/chains/EthereumContext';
import { SolanaContextProvider } from '../bitbadges-api/contexts/chains/SolanaContext';
import { collectionReducer } from '../bitbadges-api/contexts/collections/reducer';
import { WalletFooter } from '../components/navigation/WebsiteFooter';
import { WalletHeader } from '../components/navigation/WebsiteHeader';
import { Web2ContextProvider } from '../bitbadges-api/contexts/chains/Web2Context';

// 2. Create wagmiConfig
const metadata = {
  name: 'BitBadges',
  description: 'BitBadges Web App',
  url: 'https://bitbadges.io',
  icons: ['https://avatars.githubusercontent.com/u/86890740']
};

const chains = [mainnet];
const projectId = 'febf8d9986a2cd637fa4004338dad39b';
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

// 3. Create modal
createWeb3Modal({ wagmiConfig, projectId, chains });

const combinedReducers = combineReducers({
  collections: collectionReducer,
  accounts: accountReducer
});

//ignore payload serializable warning
const serializableMiddleware = createSerializableStateInvariantMiddleware({
  ignoreActions: true
});

export const store = configureStore({
  reducer: combinedReducers,
  middleware: [serializableMiddleware, thunk]
});

export type AppDispatch = typeof store.dispatch;
export type DispatchFunc = () => AppDispatch;
export const useAppDispatch: DispatchFunc = useDispatch;
export const dispatch = store.dispatch;
export interface AccountReducerState {
  accounts: Record<string, Readonly<BitBadgesUserInfo<bigint>> | undefined>;
  cosmosAddressesByUsernames: Record<string, string>;
}

export interface CollectionReducerState {
  collections: Record<string, Readonly<BitBadgesCollection<bigint>> | undefined>;
}

export interface GlobalReduxState {
  accounts: AccountReducerState;
  collections: CollectionReducerState;
}

export const PopupContent = ({ children, style }: { style?: any; children: React.ReactNode }) => {
  return (
    <div
      className="primary-text bg-slate-200 dark:bg-slate-950 border-0  dark:text-slate-200 text-blue-black-100"
      style={{
        textAlign: 'center',
        borderTop: '1px solid white',
        paddingBottom: 16,
        paddingTop: 16,
        position: 'fixed',
        width: '100%',
        zIndex: 200,
        ...style
      }}>
      {children}
    </div>
  );
};

export const CookiePopup = ({ visible, onClose, placement }: { visible: boolean; onClose: () => void; placement?: 'top' | 'bottom' }) => {
  const router = useRouter();

  return (
    <>
      {visible && (
        <PopupContent
          style={{
            bottom: placement === 'top' ? 'unset' : 0,
            top: placement === 'top' ? 0 : 'unset'
          }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
            This website uses cookies to ensure you get the best experience. By continuing to use this website, you agree to our
            <p
              style={{ marginLeft: 3 }}
              onClick={async () => await router.push('https://github.com/BitBadges/bitbadges-frontend/raw/main/public/Cookies%20Policy')}>
              <a className="text-vivid-blue">cookie policy</a>
            </p>
            ,
            <p
              style={{ marginLeft: 3 }}
              onClick={async () => await router.push('https://github.com/BitBadges/bitbadges-frontend/raw/main/public/Privacy%20Policy.pdf')}>
              <a className="text-vivid-blue">privacy policy</a>
            </p>
            , and
            <p
              style={{ marginLeft: 3 }}
              onClick={async () => await router.push('https://github.com/BitBadges/bitbadges-frontend/raw/main/public/Terms%20of%20Service.pdf')}>
              <a className="text-vivid-blue">terms of service</a>
            </p>
            .
          </div>
          <Button
            key="accept"
            className="bg-vivid-blue rounded border-0 text-white hover:bg-transparent hover:text-vivid-blue focus:bg-vivid-blue focus:text-white focus:border-0 hover:border-color-pink-600 hover:border hover:border-vivid-blue mt-3"
            onClick={() => {
              onClose();
            }}>
            Close
          </Button>
          <br />
        </PopupContent>
      )}
    </>
  );
};

const App = ({ Component, pageProps }: AppProps) => {
  //React cookies
  const [cookies, setCookie] = useCookies(['policies']);

  useEffect(() => {
    // Check if dark mode is enabled in local storage
    const isDarkMode = !localStorage.getItem('darkMode') || localStorage.getItem('darkMode') === 'true';

    // Apply dark mode styles if it's enabled
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    if ('Notification' in window) {
      //TODO: Needs a notify permission request button to work on mobile
      // Notification.requestPermission()
      //   .then(function (permission) {
      //     if (permission === 'granted') {
      //       console.log('Notification permission granted.');
      //       // You can now subscribe to push notifications.
      //     } else {
      //       console.log('Notification permission denied.');
      //     }
      //   });
      //Sample notification. Works on desktop but not mobile?
      // const options = {
      //   body: 'This is the body of a sample notification',
      //   icon: '/images/bitbadgeslogo.png',
      //   vibrate: [200, 100, 200],
      //   data: {
      //     dateOfArrival: Date.now(),
      //     primaryKey: 1
      //   }
      // };
      // navigator.serviceWorker.ready
      //   .then(function (reg) {
      //     reg.showNotification('Push Notification', options);
      //   })
      //   .catch(function (error) {
      //     console.error('Error showing notification:', error);
      //   });
    }
  }, []);

  // let deferredPrompt: Event | null = null;
  // let isInstallPromptShown = false;

  const handleBeforeInstallPrompt: EventListenerOrEventListenerObject = (event) => {
    event.preventDefault();
    // deferredPrompt = event;
    // isInstallPromptShown = true;
  };

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const myCookieValue = cookies.policies;
  // const [topPopupIsVisible, setTopPopupIsVisible] = useState(true);

  const handleCookieResponse = (accepted: boolean) => {
    if (accepted) {
      //never expires
      setCookie('policies', 'accepted', { path: '/', expires: new Date(Date.now() + 2592000) });
    }
  };

  return (
    <WagmiConfig config={wagmiConfig}>
      <Provider store={store}>
        <Web2ContextProvider>
          <BitcoinContextProvider>
            <CosmosContextProvider>
              <EthereumContextProvider>
                <SolanaContextProvider>
                  <ChainContextProvider>
                    <BrowseContextProvider>
                      <StatusContextProvider>
                        <TxTimelineContextProvider>
                          <Head>
                            <meta property="og:title" content="BitBadges" />
                            <meta property="og:image" content="/logo192.png" />
                            <meta
                              property="og:description"
                              content="BitBadges is the all-in-one platform for creating, maintaining, displaying, and verifying digital blockchain badges."
                            />

                            <meta name="title" content="BitBadges" />
                            <meta
                              name="description"
                              content="BitBadges is the all-in-one platform for creating, maintaining, displaying, and verifying digital blockchain badges."
                            />
                            <meta
                              name="keywords"
                              content="BitBadges, badges, blockchain, NFT, non-fungible token, digital badges, digital credentials, digital certificates, digital certificates, digital certificates, digital certificates"
                            />
                            <link rel="apple-touch-icon" href="/logo192.png" />
                            <link rel="manifest" href="/manifest.json" />
                            <title>BitBadges</title>
                          </Head>

                          <div className="">
                            <div className="layout gradient-bg">
                              <WalletHeader />
                              {/* {topPopupIsVisible &&
                          <PopupContent>
                            <div style={{ textAlign: 'center' }}>Important announcement</div>
                           
                            <Button key="accept" className='bg-vivid-blue rounded border-0 text-white hover:bg-transparent hover:text-vivid-blue focus:bg-vivid-blue focus:text-white focus:border-0 hover:border-color-pink-600 hover:border hover:border-vivid-blue mt-3' onClick={() => setTopPopupIsVisible(false)}>
                              Close
                            </Button>
                          </PopupContent>} */}
                              <Component {...pageProps} />
                              <CookiePopup
                                visible={myCookieValue !== 'accepted'}
                                onClose={() => {
                                  handleCookieResponse(true);
                                }}
                                placement="bottom"
                              />
                              <WalletFooter />
                            </div>
                          </div>
                        </TxTimelineContextProvider>
                      </StatusContextProvider>
                    </BrowseContextProvider>
                  </ChainContextProvider>
                </SolanaContextProvider>
              </EthereumContextProvider>
            </CosmosContextProvider>
          </BitcoinContextProvider>
        </Web2ContextProvider>
      </Provider>
    </WagmiConfig>
  );
};

export default App;
