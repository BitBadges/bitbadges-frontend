/* eslint-disable react-hooks/exhaustive-deps */
import { PresetResource, SupportedChainMetadata } from 'blockin';
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { useAlgorandContext } from './algorand/AlgorandContext';
import { useEthereumContext } from './ethereum/EthereumContext';

export type SignChallengeResponse = {
    originalBytes?: Uint8Array;
    signatureBytes?: Uint8Array;
    message?: string;
}

export type ChainContextType = ChainSpecificContextType & {
    //Global
    chain: string, //Should be consistent with the ChainSelect Props for the UI button
    setChain: Dispatch<SetStateAction<string>>,

    loggedIn: boolean,
    setLoggedIn: Dispatch<SetStateAction<boolean>>,
}

export type ChainSpecificContextType = {
    //Chain Specific
    connected: boolean,
    setConnected: Dispatch<SetStateAction<boolean>>,

    chainId: string,
    setChainId: Dispatch<SetStateAction<string>>,

    address: string,
    setAddress: Dispatch<SetStateAction<string>>,

    cosmosAddress: string,
    setCosmosAddress: Dispatch<SetStateAction<string>>,

    sequence: number,
    incrementSequence: () => void,
    setSequence: Dispatch<SetStateAction<number>>,

    publicKey: string,
    setPublicKey: Dispatch<SetStateAction<string>>,

    accountNumber: number,
    setAccountNumber: Dispatch<SetStateAction<number>>,

    isRegistered: boolean,
    setIsRegistered: Dispatch<SetStateAction<boolean>>,

    //These are assumed to remain constant, but included because they are chain-specific
    disconnect: () => Promise<any>,
    connect: () => Promise<any>,
    signChallenge: (challenge: string) => Promise<SignChallengeResponse>,
    signTxn: (txn: object) => Promise<any>,
    getPublicKey: (cosmosAddress: string) => Promise<string>,
    displayedResources: PresetResource[],
    selectedChainInfo: SupportedChainMetadata | undefined,
    ownedAssetIds: string[],
}

const ChainContext = createContext<ChainContextType>({
    connected: false,
    setConnected: () => { },
    loggedIn: false,
    setLoggedIn: () => { },
    connect: async () => { },
    disconnect: async () => { },
    chainId: '1',
    setChainId: async () => { },
    address: '',
    setAddress: () => { },
    signChallenge: async () => { return {} },
    signTxn: async () => { },
    getPublicKey: async () => { return '' },
    chain: 'Default',
    setChain: () => { },
    ownedAssetIds: [],
    displayedResources: [],
    selectedChainInfo: {},
    cosmosAddress: '',
    setCosmosAddress: () => { },
    sequence: -1,
    incrementSequence: () => { },
    setSequence: () => { },
    publicKey: '',
    setPublicKey: () => { },
    accountNumber: -1,
    setAccountNumber: () => { },
    isRegistered: false,
    setIsRegistered: () => { },
});

type Props = {
    children?: React.ReactNode
};

export const ChainContextProvider: React.FC<Props> = ({ children }) => {
    const [chain, setChain] = useState<string>('Ethereum');
    const [loggedIn, setLoggedIn] = useState<boolean>(false);
    const ethereumContext = useEthereumContext();
    const algorandContext = useAlgorandContext();

    useEffect(() => {
        if (chain === 'Ethereum') {
            ethereumContext.setChainId('eth');
        } else if (chain === 'Polygon') {
            ethereumContext.setChainId('polygon');
        } else if (chain === 'Avalanche') {
            ethereumContext.setChainId('avalanche');
        } else if (chain === 'BSC') {
            ethereumContext.setChainId('bsc');
        } else if (chain === 'Algorand Mainnet') {
            algorandContext.setChainId('Mainnet');
        } else if (chain === 'Algorand Testnet') {
            algorandContext.setChainId('Testnet');
        }
    }, [chain, setChain, algorandContext, ethereumContext]);

    let currentChainContext: ChainSpecificContextType;
    if (chain?.startsWith('Algorand')) {
        currentChainContext = algorandContext;
    } else {
        currentChainContext = ethereumContext;
    }

    const chainContext: ChainContextType = {
        chain,
        setChain,
        loggedIn,
        setLoggedIn,
        ...currentChainContext
    };

    return <ChainContext.Provider value={chainContext}>
        {children}
    </ChainContext.Provider>;
}


export const useChainContext = () => useContext(ChainContext);

