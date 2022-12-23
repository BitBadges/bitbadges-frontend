import '../styles/index.css'
import type { AppProps } from 'next/app'
import { ChainContextProvider } from '../chain/ChainContext';
import { AlgorandContextProvider } from '../chain/algorand/AlgorandContext';
import { EthereumContextProvider } from '../chain/ethereum/EthereumContext';
import { Layout } from 'antd';
import { WalletHeader } from '../components/WebsiteHeader';
import { WalletFooter } from '../components/WebsiteFooter';
import '../styles/antd-override-styles.css'

// const createdWeb3Modal = createWeb3Modal();

const App = ({ Component, pageProps }: AppProps) => {

    return (
        <EthereumContextProvider>
            <AlgorandContextProvider>
                <ChainContextProvider>
                    <Layout className="layout">
                        <WalletHeader />
                        <Component {...pageProps} />
                        <WalletFooter />
                    </Layout>
                </ChainContextProvider>
            </AlgorandContextProvider>
        </EthereumContextProvider>
    )
}

export default App;