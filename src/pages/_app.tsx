import { Button, Layout } from 'antd';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useCookies } from 'react-cookie';
import { WalletFooter } from '../components/navigation/WebsiteFooter';
import { WalletHeader } from '../components/navigation/WebsiteHeader';
import { PRIMARY_BLUE, SECONDARY_TEXT } from '../constants';
import { AccountsContextProvider } from '../contexts/AccountsContext';
import { ChainContextProvider } from '../contexts/ChainContext';
import { CollectionsContextProvider } from '../contexts/CollectionsContext';
import { StatusContextProvider } from '../contexts/StatusContext';
import { CosmosContextProvider } from '../contexts/chains/CosmosContext';
import { EthereumContextProvider } from '../contexts/chains/EthereumContext';
import '../styles/antd-override-styles.css';
import '../styles/index.css';
import { useEffect, useState } from 'react';

const App = ({ Component, pageProps }: AppProps) => {

    //React cookies
    const [cookies, setCookie] = useCookies(['policies']);
    const router = useRouter();
    const [myCookieValue, setMyCookieValue] = useState(null);
    const [handled, setHandled] = useState(false);

    useEffect(() => {
        // Check if the cookie exists before using it
        if (cookies.policies) {
            setMyCookieValue(cookies.policies);
        }
        setHandled(true);
    }, [cookies]);

    const handleCookieResponse = (accepted: boolean) => {
        if (accepted) {
            setCookie('policies', 'accepted', { path: '/' });
        }
    };

    return (
        <CosmosContextProvider>
            <EthereumContextProvider>
                <ChainContextProvider>
                    <AccountsContextProvider>
                        <CollectionsContextProvider>
                            <StatusContextProvider>
                                <Layout className="layout">
                                    <WalletHeader />
                                    <>{console.log("TEST", JSON.stringify(cookies))}</>
                                    <>{console.log(cookies && cookies.policies !== 'accepted')}</>
                                    {handled && myCookieValue !== 'accepted' &&
                                        <div style={{
                                            textAlign: 'center',
                                            color: SECONDARY_TEXT,
                                            background: PRIMARY_BLUE,
                                            borderBottom: '1px solid white',
                                            paddingBottom: 16,
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'center'
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
                            </StatusContextProvider>
                        </CollectionsContextProvider>
                    </AccountsContextProvider>
                </ChainContextProvider>
            </EthereumContextProvider>
        </CosmosContextProvider >
    )
}

export default App;