import '../styles/index.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import WalletConnect from '@walletconnect/client'
import { ChainContextProvider, SignChallengeResponse } from '../chain_handlers_frontend/ChainContext';
import { connect as algorandConnect } from '../chain_handlers_frontend/algorand/WalletConnect';
import { AlgorandContext, AlgorandContextProvider } from '../chain_handlers_frontend/algorand/AlgorandContext';
import { PresetResource } from 'blockin';
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import { EthereumContext, EthereumContextProvider } from '../chain_handlers_frontend/ethereum/EthereumContext';
import { web3ModalActions } from '../redux/web3ModalSlice';
import { useDispatch } from 'react-redux';
import { Layout } from 'antd';
import { WalletHeader } from '../components/WebsiteHeader';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletFooter } from '../components/WebsiteFooter';
import store from '../redux/store';
import { Provider } from 'react-redux';
import '../styles/antd-override-styles.css'


// const createdWeb3Modal = createWeb3Modal();

const App = ({ Component, pageProps }: AppProps) => {

    return (
        <Provider store={store}>
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
        </Provider>
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
