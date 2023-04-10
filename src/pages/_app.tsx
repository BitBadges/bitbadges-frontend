import '../styles/index.css'
import type { AppProps } from 'next/app'
import { ChainContextProvider } from '../contexts/ChainContext';
import { EthereumContextProvider } from '../contexts/chains/EthereumContext';
import { Layout } from 'antd';
import { WalletHeader } from '../components/navigation/WebsiteHeader';
import { WalletFooter } from '../components/navigation/WebsiteFooter';
import '../styles/antd-override-styles.css'
import '../styles/index.css'
import { AccountsContextProvider } from '../contexts/AccountsContext';
import { CollectionsContextProvider } from '../contexts/CollectionsContext';
import { StatusContextProvider } from '../contexts/StatusContext';
import { CosmosContextProvider } from '../contexts/chains/CosmosContext';

const App = ({ Component, pageProps }: AppProps) => {

    return (
        <CosmosContextProvider>
            <EthereumContextProvider>
                <ChainContextProvider>
                    <AccountsContextProvider>
                        <CollectionsContextProvider>
                            <StatusContextProvider>
                                <Layout className="layout">
                                    <WalletHeader />
                                    <Component {...pageProps} />
                                    <WalletFooter />
                                </Layout>
                            </StatusContextProvider>
                        </CollectionsContextProvider>
                    </AccountsContextProvider>
                </ChainContextProvider>
            </EthereumContextProvider>
        </CosmosContextProvider>
    )
}

export default App;