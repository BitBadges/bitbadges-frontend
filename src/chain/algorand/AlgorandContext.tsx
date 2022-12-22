import WalletConnect from '@walletconnect/client';
import { PresetResource } from 'blockin';
import { createContext, Dispatch, SetStateAction, useContext, useState } from 'react';
import { ChainSpecificContextType } from '../ChainContext';
import { signChallengeAlgo } from './sign_challenge';
import { connect as algorandConnect } from './WalletConnect'

export type AlgorandContextType = ChainSpecificContextType & {
    connector?: WalletConnect,
    setConnector: Dispatch<SetStateAction<WalletConnect | undefined>>;
}

export const AlgorandContext = createContext<AlgorandContextType>({
    connector: undefined,
    setConnector: () => { },
    connect: async () => { },
    disconnect: async () => { },
    address: '',
    chainId: 'Mainnet',
    setChainId: () => { },
    setAddress: () => { },
    signChallenge: async () => { return {} },
    ownedAssetIds: [],
    displayedResources: [],
    selectedChainInfo: {},
    connected: false,
    setConnected: () => { }
})

export const useAlgorandContext = () => useContext(AlgorandContext)

type Props = {
    children?: React.ReactNode
};

export const AlgorandContextProvider: React.FC<Props> = ({ children }) => {
    const [connector, setConnector] = useState<WalletConnect>();
    const [address, setAddress] = useState<string>('')
    const [connected, setConnected] = useState<boolean>(false);
    const [chainId, setChainId] = useState('Mainnet');

    const selectedChainInfo = undefined;
    const displayedResources: PresetResource[] = [];

    //If you would like to support this, you can call this with a useEffect every time connected or address is updated
    const ownedAssetIds: string[] = [];

    const connect = async () => {
        algorandConnect(setConnector, setAddress, setConnected);
    }

    const disconnect = async () => {
        await connector?.killSession({ message: 'bye' })
        connector?.rejectSession({ message: 'bye' })
        setConnector(undefined)
        setAddress('')
        setConnected(false);
    };

    const signChallenge = async (challenge: string) => {
        if (connector) return signChallengeAlgo(connector, challenge, chainId === 'Testnet');
        else throw 'Error signing challenge'
    }

    const algorandContext: AlgorandContextType = {
        connected,
        setConnected,
        connect,
        disconnect,
        ownedAssetIds,
        selectedChainInfo,
        displayedResources,
        signChallenge,
        address,
        setAddress,
        connector,
        setConnector,
        chainId,
        setChainId
    };

    return <AlgorandContext.Provider value={algorandContext}>
        {children}
    </AlgorandContext.Provider>
}

export const useEthereumContext = () => useContext(AlgorandContext)  