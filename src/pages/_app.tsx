import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { Button, Layout } from 'antd';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { Provider } from 'react-redux';
import { mainnet } from 'wagmi/chains';
import { BrowseContextProvider } from '../bitbadges-api/contexts/BrowseContext';
import { ChainContextProvider } from '../bitbadges-api/contexts/ChainContext';
import { StatusContextProvider } from '../bitbadges-api/contexts/StatusContext';
import { TxTimelineContextProvider } from '../bitbadges-api/contexts/TxTimelineContext';
import { AccountReducerState, AccountsContextProvider } from '../bitbadges-api/contexts/accounts/AccountsContext';
import { CosmosContextProvider } from '../bitbadges-api/contexts/chains/CosmosContext';
import { EthereumContextProvider } from '../bitbadges-api/contexts/chains/EthereumContext';
import { CollectionReducerState, CollectionsContextProvider } from '../bitbadges-api/contexts/collections/CollectionsContext';
import { WalletFooter } from '../components/navigation/WebsiteFooter';
import { WalletHeader } from '../components/navigation/WebsiteHeader';
import { INFINITE_LOOP_MODE } from '../constants';

import { configureStore, createSerializableStateInvariantMiddleware } from '@reduxjs/toolkit';
import { WagmiConfig } from 'wagmi';

import { combineReducers } from 'redux';
import { accountReducer } from '../bitbadges-api/contexts/accounts/reducer';
import { collectionReducer } from '../bitbadges-api/contexts/collections/reducer';
import '../styles/antd-override-styles.css';
import '../styles/index.css';

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


const store = configureStore({
  reducer: combinedReducers,
  middleware: [serializableMiddleware],
})

export interface GlobalReduxState {
  accounts: AccountReducerState
  collections: CollectionReducerState
}

const App = ({ Component, pageProps }: AppProps) => {
  //React cookies
  const [cookies, setCookie] = useCookies(['policies']);
  const router = useRouter();
  const [myCookieValue, setMyCookieValue] = useState(null);

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
        <AccountsContextProvider>
          <CosmosContextProvider>
            <EthereumContextProvider>
              <ChainContextProvider>
                <CollectionsContextProvider>
                  <BrowseContextProvider>
                    <StatusContextProvider>
                      <TxTimelineContextProvider>

                        <Layout className="gradient-bg">
                          <WalletHeader />
                          <Component {...pageProps} />
                          {myCookieValue !== 'accepted' &&
                            <div className='primary-text black-bg'
                              style={{
                                textAlign: 'center',
                                borderTop: '1px solid white',
                                paddingBottom: 16,
                                paddingTop: 16,
                                position: 'fixed',
                                bottom: 0,
                                width: '100%',
                                zIndex: 200
                              }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                flexWrap: 'wrap'
                              }}>
                                This website uses cookies to ensure you get the best experience.
                                By continuing to use this website, you agree to our use of cookies, {" "}
                                <p style={{ marginLeft: 3 }} onClick={() => router.push('https://github.com/BitBadges/bitbadges.org/raw/main/policies/Privacy%20Policy.pdf')}><a>privacy policy</a></p>, and
                                <p style={{ marginLeft: 3 }} onClick={() => router.push('https://github.com/BitBadges/bitbadges.org/raw/main/policies/Terms%20of%20Service.pdf')}><a>terms of service</a></p>.
                              </div>
                              <Button key="accept" className='styled-button' onClick={() => handleCookieResponse(true)}>
                                Close
                              </Button>
                              <br />
                            </div>}
                          <WalletFooter />
                        </Layout>

                      </TxTimelineContextProvider>
                    </StatusContextProvider>
                  </BrowseContextProvider>
                </CollectionsContextProvider>
              </ChainContextProvider>
            </EthereumContextProvider>
          </CosmosContextProvider>
        </AccountsContextProvider>
      </Provider>
    </WagmiConfig>
  )
}

export default App;