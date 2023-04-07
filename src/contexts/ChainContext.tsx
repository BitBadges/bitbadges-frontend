/* eslint-disable react-hooks/exhaustive-deps */
import { AnnouncementActivityItem, TransferActivityItem } from 'bitbadges-sdk';
import { PresetResource, SupportedChainMetadata } from 'blockin';
import { Dispatch, SetStateAction, createContext, useContext, useEffect, useState } from 'react';
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
}

export type ChainSpecificContextType = {

    loggedIn: boolean,
    setLoggedIn: Dispatch<SetStateAction<boolean>>,

    //Chain Specific
    connected: boolean,
    setConnected: Dispatch<SetStateAction<boolean>>,

    chainId: string,
    setChainId: Dispatch<SetStateAction<string>>,

    address: string,
    setAddress: Dispatch<SetStateAction<string>>,

    cosmosAddress: string,
    setCosmosAddress: Dispatch<SetStateAction<string>>,

    name: string,
    setName: Dispatch<SetStateAction<string>>,

    avatar: string,
    setAvatar: Dispatch<SetStateAction<string>>,

    github: string,
    setGithub: Dispatch<SetStateAction<string>>,

    discord: string,
    setDiscord: Dispatch<SetStateAction<string>>,

    telegram: string,
    setTelegram: Dispatch<SetStateAction<string>>,

    twitter: string,
    setTwitter: Dispatch<SetStateAction<string>>,

    sequence: number,
    incrementSequence: () => void,
    setSequence: Dispatch<SetStateAction<number>>,

    publicKey: string,
    setPublicKey: Dispatch<SetStateAction<string>>,

    accountNumber: number,
    setAccountNumber: Dispatch<SetStateAction<number>>,

    isRegistered: boolean,
    setIsRegistered: Dispatch<SetStateAction<boolean>>,

    activity: TransferActivityItem[],
    setActivity: Dispatch<SetStateAction<TransferActivityItem[]>>,

    announcements: AnnouncementActivityItem[],
    setAnnouncements: Dispatch<SetStateAction<AnnouncementActivityItem[]>>,

    announcementsBookmark: string,
    setAnnouncementsBookmark: Dispatch<SetStateAction<string>>,

    activityBookmark: string,
    setActivityBookmark: Dispatch<SetStateAction<string>>,

    announcementsHasMore: boolean,
    setAnnouncementsHasMore: Dispatch<SetStateAction<boolean>>,

    activityHasMore: boolean,
    setActivityHasMore: Dispatch<SetStateAction<boolean>>,

    seenActivity: number,
    setSeenActivity: Dispatch<SetStateAction<number>>,

    //These are assumed to remain constant, but included because they are chain-specific
    disconnect: () => Promise<any>,
    connect: () => Promise<any>,
    signChallenge: (challenge: string) => Promise<SignChallengeResponse>,
    signTxn: (txn: object) => Promise<any>,
    getPublicKey: (cosmosAddress: string) => Promise<string>,
    displayedResources: PresetResource[],
    selectedChainInfo: (SupportedChainMetadata & { getAddressForName?: (name: string) => Promise<string | undefined>; }) | undefined,
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
    name: '',
    setName: () => { },
    avatar: '',
    setAvatar: () => { },
    github: '',
    setGithub: () => { },
    discord: '',
    setDiscord: () => { },
    telegram: '',
    setTelegram: () => { },
    twitter: '',
    setTwitter: () => { },
    activity: [],
    setActivity: () => { },
    announcements: [],
    setAnnouncements: () => { },
    announcementsBookmark: '',
    setAnnouncementsBookmark: () => { },
    activityBookmark: '',
    setActivityBookmark: () => { },
    announcementsHasMore: false,
    setAnnouncementsHasMore: () => { },
    activityHasMore: false,
    setActivityHasMore: () => { },
    seenActivity: 0,
    setSeenActivity: () => { },
});

type Props = {
    children?: React.ReactNode
};

export const ChainContextProvider: React.FC<Props> = ({ children }) => {
    const [chain, setChain] = useState<string>('Ethereum');


    const ethereumContext = useEthereumContext();


    //TODO: better handle cookies (with address changes, expirations, etc)

    useEffect(() => {
        if (chain === 'Ethereum') {
            ethereumContext.setChainId('eth');
        } else if (chain === 'Polygon') {
            ethereumContext.setChainId('polygon');
        } else if (chain === 'Avalanche') {
            ethereumContext.setChainId('avalanche');
        } else if (chain === 'BSC') {
            ethereumContext.setChainId('bsc');
        }
        // else if (chain === 'Algorand Mainnet') {
        //     algorandContext.setChainId('Mainnet');
        // } else if (chain === 'Algorand Testnet') {
        //     algorandContext.setChainId('Testnet');
        // }
    }, [chain, setChain, ethereumContext]);

    let currentChainContext: ChainSpecificContextType;
    // if (chain?.startsWith('Algorand')) {
    //     currentChainContext = algorandContext;
    // } else {
    //     currentChainContext = ethereumContext;
    // }
    currentChainContext = ethereumContext;

    const chainContext: ChainContextType = {
        chain,
        setChain,

        ...currentChainContext
    };

    return <ChainContext.Provider value={chainContext}>
        {children}
    </ChainContext.Provider>;
}


export const useChainContext = () => useContext(ChainContext);

