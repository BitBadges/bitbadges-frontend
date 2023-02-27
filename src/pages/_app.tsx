import '../styles/index.css'
import type { AppProps } from 'next/app'
import { ChainContextProvider } from '../contexts/ChainContext';
import { AlgorandContextProvider } from '../contexts/algorand/AlgorandContext';
import { EthereumContextProvider } from '../contexts/ethereum/EthereumContext';
import { Layout } from 'antd';
import { WalletHeader } from '../components/navigation/WebsiteHeader';
import { WalletFooter } from '../components/navigation/WebsiteFooter';
import '../styles/antd-override-styles.css'
import '../styles/index.css'
import { AccountsContextProvider } from '../contexts/AccountsContext';
import { CollectionsContextProvider } from '../contexts/CollectionsContext';

const App = ({ Component, pageProps }: AppProps) => {

    return (
        <EthereumContextProvider>
            <AlgorandContextProvider>
                <ChainContextProvider>
                    <AccountsContextProvider>
                        <CollectionsContextProvider>
                            <Layout className="layout">
                                <WalletHeader />
                                <Component {...pageProps} />
                                <WalletFooter />
                            </Layout>
                        </CollectionsContextProvider>
                    </AccountsContextProvider>
                </ChainContextProvider>
            </AlgorandContextProvider>
        </EthereumContextProvider>
    )
}

export default App;