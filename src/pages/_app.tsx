import '../styles/index.css'
import type { AppProps } from 'next/app'
import { ChainContextProvider } from '../chain/ChainContext';
import { AlgorandContextProvider } from '../chain/algorand/AlgorandContext';
import { EthereumContextProvider } from '../chain/ethereum/EthereumContext';
import { Layout } from 'antd';
import { WalletHeader } from '../components/common/WebsiteHeader';
import { WalletFooter } from '../components/common/WebsiteFooter';
import '../styles/antd-override-styles.css'
import '../styles/index.css'
import { AccountsContextProvider } from '../accounts/AccountsContext';

// const createdWeb3Modal = createWeb3Modal();

const App = ({ Component, pageProps }: AppProps) => {

    return (
        <EthereumContextProvider>
            <AlgorandContextProvider>
                <ChainContextProvider>
                    <AccountsContextProvider>
                        <Layout className="layout">
                            <WalletHeader />
                            <Component {...pageProps} />
                            <WalletFooter />
                        </Layout>
                    </AccountsContextProvider>
                </ChainContextProvider>
            </AlgorandContextProvider>
        </EthereumContextProvider>
    )
}

export default App;