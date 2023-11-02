import '../styles/custom.css'
import '../styles/index.css';
import '../styles/antd-override-styles.css';

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { Button } from 'antd';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { Provider, useDispatch } from 'react-redux';
import { mainnet } from 'wagmi/chains';
import { BrowseContextProvider } from '../bitbadges-api/contexts/BrowseContext';
import { ChainContextProvider } from '../bitbadges-api/contexts/ChainContext';
import { StatusContextProvider } from '../bitbadges-api/contexts/StatusContext';
import { TxTimelineContextProvider } from '../bitbadges-api/contexts/TxTimelineContext';
import { CosmosContextProvider } from '../bitbadges-api/contexts/chains/CosmosContext';
import { EthereumContextProvider } from '../bitbadges-api/contexts/chains/EthereumContext';
import { WalletFooter } from '../components/navigation/WebsiteFooter';
import { WalletHeader } from '../components/navigation/WebsiteHeader';
import { INFINITE_LOOP_MODE } from '../constants';
import { configureStore, createSerializableStateInvariantMiddleware } from '@reduxjs/toolkit';
import { WagmiConfig } from 'wagmi';
import { combineReducers } from 'redux';
import { AccountRequestParams, accountReducer } from '../bitbadges-api/contexts/accounts/reducer';
import { CollectionRequestParams, collectionReducer } from '../bitbadges-api/contexts/collections/reducer';
import thunk from 'redux-thunk';
import type { } from 'redux-thunk/extend-redux';
import { BitBadgesUserInfo, CollectionMap } from 'bitbadgesjs-utils';

// 2. Create wagmiConfig
const metadata = {
  name: 'BitBadges',
  description: 'BitBadges is a protocol for creating, managing, and sharing digital badges on the blockchain.',
  url: 'https://bitbadges.io',
  icons: ['https://avatars.githubusercontent.com/u/86890740']
}

const chains = [mainnet]
const projectId = 'febf8d9986a2cd637fa4004338dad39b'
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata })

// 3. Create modal
createWeb3Modal({ wagmiConfig, projectId, chains })


const combinedReducers = combineReducers({
  collections: collectionReducer,
  accounts: accountReducer,
})

//ignore payload serializable warning
const serializableMiddleware = createSerializableStateInvariantMiddleware({
  ignoreActions: true,
});


export const store = configureStore({
  reducer: combinedReducers,
  middleware: [serializableMiddleware, thunk],
})

export type AppDispatch = typeof store.dispatch
export type DispatchFunc = () => AppDispatch
export const useAppDispatch: DispatchFunc = useDispatch
export const dispatch = store.dispatch
export interface AccountReducerState {
  accounts: Record<string, BitBadgesUserInfo<bigint> | undefined>;
  cosmosAddressesByUsernames: { [username: string]: string };
  loading: boolean;
  error: string | undefined;
  queue: AccountRequestParams[];
  fetching: AccountRequestParams[];
}

export interface CollectionReducerState {
  collections: CollectionMap<bigint>,
  queue: CollectionRequestParams[],
  fetching: CollectionRequestParams[],
  error: string | undefined,
  loading: boolean,
}

export interface GlobalReduxState {
  accounts: AccountReducerState
  collections: CollectionReducerState
}

export const PopupContent = ({ children, style }: { style?: any, children: React.ReactNode }) => {
  return <div className='primary-text bg-slate-200 dark:bg-slate-950 border-0  dark:text-slate-200 text-blue-black-100'
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
}

export const CookiePopup = ({ visible, onClose, placement }: {
  visible: boolean,
  onClose: () => void,
  placement?: 'top' | 'bottom'
}) => {
  const router = useRouter();

  return <>
    {visible &&
      <PopupContent
        style={{
          bottom: placement === 'top' ? 'unset' : 0,
          top: placement === 'top' ? 0 : 'unset',
        }}
      >

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          This website uses cookies to ensure you get the best experience.
          By continuing to use this website, you agree to our use of cookies, {" "}
          <p style={{ marginLeft: 3 }} onClick={() => router.push('https://github.com/BitBadges/bitbadges.org/raw/main/policies/Privacy%20Policy.pdf')}><a className='text-vivid-blue'>privacy policy</a></p>, and
          <p style={{ marginLeft: 3 }} onClick={() => router.push('https://github.com/BitBadges/bitbadges.org/raw/main/policies/Terms%20of%20Service.pdf')}><a className='text-vivid-blue'>terms of service</a></p>.
        </div>
        <Button key="accept" className='bg-vivid-blue rounded border-0 text-white hover:bg-transparent hover:text-vivid-blue focus:bg-vivid-blue focus:text-white focus:border-0 hover:border-color-pink-600 hover:border hover:border-vivid-blue mt-3' onClick={() => onClose()}>
          Close
        </Button>
        <br />
      </PopupContent>}
  </>
}

const App = ({ Component, pageProps }: AppProps) => {
  //React cookies
  const [cookies, setCookie] = useCookies(['policies']);

  useEffect(() => {
    // Check if dark mode is enabled in local storage
    const isDarkMode = localStorage.getItem('darkMode') === 'true';

    // Apply dark mode styles if it's enabled
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const [myCookieValue, setMyCookieValue] = useState(null);
  // const [topPopupIsVisible, setTopPopupIsVisible] = useState(true);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: cookie check');
    // Check if the cookie exists before using it
    if (cookies.policies) {
      setMyCookieValue(cookies.policies);
    }
  }, [cookies]);

  const handleCookieResponse = (accepted: boolean) => {
    if (accepted) {
      //never expires
      setCookie('policies', 'accepted', { path: '/', expires: new Date(Date.now() + 2592000) });
    }
  };

  return (
    <WagmiConfig config={wagmiConfig}>
      <Provider store={store}>
        <CosmosContextProvider>
          <EthereumContextProvider>
            <ChainContextProvider>
              <BrowseContextProvider>
                <StatusContextProvider>
                  <TxTimelineContextProvider>
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
                        <CookiePopup visible={myCookieValue !== 'accepted'} onClose={() => handleCookieResponse(true)} placement='bottom' />
                        <WalletFooter />
                      </div>
                    </div>
                  </TxTimelineContextProvider>
                </StatusContextProvider>
              </BrowseContextProvider>
            </ChainContextProvider>
          </EthereumContextProvider>
        </CosmosContextProvider>
      </Provider>
    </WagmiConfig>
  )
}

export default App;