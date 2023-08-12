import { Button, Layout } from 'antd';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useCookies } from 'react-cookie';
import { WalletFooter } from '../components/navigation/WebsiteFooter';
import { WalletHeader } from '../components/navigation/WebsiteHeader';
import { AccountsContextProvider } from '../bitbadges-api/contexts/AccountsContext';
import { ChainContextProvider } from '../bitbadges-api/contexts/ChainContext';
import { CollectionsContextProvider } from '../bitbadges-api/contexts/CollectionsContext';
import { StatusContextProvider } from '../bitbadges-api/contexts/StatusContext';
import { CosmosContextProvider } from '../bitbadges-api/contexts/chains/CosmosContext';
import { EthereumContextProvider } from '../bitbadges-api/contexts/chains/EthereumContext';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import '../styles/index.css';
import '../styles/antd-override-styles.css';
import { useEffect, useState } from 'react';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { Web3Modal } from '@web3modal/react'
import { configureChains, createClient, WagmiConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { INFINITE_LOOP_MODE } from '../constants';

const chains = [mainnet]
const projectId = 'febf8d9986a2cd637fa4004338dad39b'

const { provider } = configureChains(chains, [w3mProvider({ projectId })])
const wagmiClient = createClient({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, version: 1, chains }),
  provider,
})
const ethereumClient = new EthereumClient(wagmiClient, chains)
const queryClient = new QueryClient()


const App = ({ Component, pageProps }: AppProps) => {
  //React cookies
  const [cookies, setCookie] = useCookies(['policies']);
  const router = useRouter();
  const [myCookieValue, setMyCookieValue] = useState(null);
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: cookie check');
    // Check if the cookie exists before using it
    if (cookies.policies) {
      setMyCookieValue(cookies.policies);
    }
    setHandled(true);
  }, [cookies]);

  const handleCookieResponse = (accepted: boolean) => {
    if (accepted) {
      //never expires
      setCookie('policies', 'accepted', { path: '/', expires: new Date(Date.now() + 2592000) });
    }
  };

  return (
    <AccountsContextProvider>
      <CosmosContextProvider>
        <QueryClientProvider client={queryClient}>
          <EthereumContextProvider>
            <ChainContextProvider>
              <CollectionsContextProvider>
                <StatusContextProvider>
                  <WagmiConfig client={wagmiClient}>
                    <Web3Modal projectId={projectId} ethereumClient={ethereumClient}
                      themeMode="dark"
                    />
                    <Layout className="layout">
                      <WalletHeader />
                      {myCookieValue !== 'accepted' &&
                        <div className='primary-text primary-blue-bg'
                          style={{
                            textAlign: 'center',
                            borderBottom: '1px solid white',
                            paddingBottom: 16,
                          }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                          }}>
                            This website uses cookies to ensure you get the best experience.
                            By continuing to use this website, you agree to our use of cookies, {" "}
                            <p style={{ marginLeft: 3 }} onClick={() => router.push('/policies/privacy')}><a>privacy policy</a></p>, and
                            <p style={{ marginLeft: 3 }} onClick={() => router.push('/policies/termsofservice')}><a>terms of service</a></p>.
                          </div>
                          <Button key="accept" type='primary' onClick={() => handleCookieResponse(true)}>
                            Accept
                          </Button>
                          <br />
                        </div>}
                      <Component {...pageProps} />
                      <WalletFooter />
                    </Layout>
                  </WagmiConfig>
                </StatusContextProvider>
              </CollectionsContextProvider>
            </ChainContextProvider>
          </EthereumContextProvider>
        </QueryClientProvider>
      </CosmosContextProvider>
    </AccountsContextProvider>
  )
}

export default App;