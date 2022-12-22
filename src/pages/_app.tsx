import '../styles/index.css'
import type { AppProps } from 'next/app'
import { ChainContextProvider } from '../chain_handlers_frontend/ChainContext';
import { AlgorandContextProvider } from '../chain_handlers_frontend/algorand/AlgorandContext';
import { EthereumContextProvider } from '../chain_handlers_frontend/ethereum/EthereumContext';
import { Layout } from 'antd';
import { WalletHeader } from '../components/WebsiteHeader';
import { WalletFooter } from '../components/WebsiteFooter';
import { Provider } from 'react-redux';
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

export default App


// import { WalletHeader } from './components/WebsiteHeader';
// import { Home } from './screens/Home';
// import { Mint } from './screens/Mint';
// import { Browse } from './screens/Browse';
// import { User } from './screens/User';
// import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import { WalletFooter } from './components/WebsiteFooter';
// import { Account } from './screens/Account';
// import DisconnectedWrapper from './screens/Disconnected';
// import { AccountSettings } from './screens/AccountSettings';
// import React from 'react';
// import { Layout } from 'antd';


// const createdWeb3Modal = createWeb3Modal();

// function App() {


//     return (
//         <BrowserRouter>
//             <div className="App">
//                 <Layout className="layout">
//                     <WalletHeader />

//                     <Routes>
//                         <Route path="/" element={<Home />} />
//                         <Route
//                             path="mint"
//                             element={
//                                 <DisconnectedWrapper screenNode={<Mint />} />
//                             }
//                         />
//                         <Route path="browse" element={<Browse />} />
//                         <Route path="user/:userId" element={<User />} />
//                         <Route
//                             path="account"
//                             element={
//                                 <DisconnectedWrapper screenNode={<Account />} />
//                             }
//                         />
//                         <Route
//                             path="account/customize"
//                             element={
//                                 <DisconnectedWrapper
//                                     screenNode={<AccountSettings />}
//                                 />
//                             }
//                         />
//                     </Routes>

//                     <WalletFooter />
//                 </Layout>
//             </div>
//         </BrowserRouter>
//     );
// }

// export default App;
