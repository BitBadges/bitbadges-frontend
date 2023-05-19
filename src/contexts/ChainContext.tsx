/* eslint-disable react-hooks/exhaustive-deps */
import { AnnouncementActivityItem, BitBadgesUserInfo, SupportedChain, TransferActivityItem } from 'bitbadgesjs-utils';
import { PresetResource, SupportedChainMetadata } from 'blockin';
import { Dispatch, SetStateAction, createContext, useContext, useEffect, useState } from 'react';
import { useEthereumContext } from './chains/EthereumContext';
import { useCosmosContext } from './chains/CosmosContext';
import { BLANK_USER_INFO } from '../constants';

export type SignChallengeResponse = {
  originalBytes?: Uint8Array;
  signatureBytes?: Uint8Array;
  message?: string;
}

export type ChainContextType = ChainSpecificContextType & {

}

export type ChainSpecificContextType = {
  userInfo: BitBadgesUserInfo,
  setUserInfo: Dispatch<SetStateAction<BitBadgesUserInfo>>,

  balance: number,
  setBalance: Dispatch<SetStateAction<number>>,

  loggedIn: boolean,
  setLoggedIn: Dispatch<SetStateAction<boolean>>,

  //Chain Specific
  connected: boolean,
  setConnected: Dispatch<SetStateAction<boolean>>,

  chainId: string,
  setChainId: Dispatch<SetStateAction<string>>,

  incrementSequence: () => void,

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

  updatePortfolioInfo: (address: string) => Promise<void>,

  airdropped: boolean,
  setAirdropped: Dispatch<SetStateAction<boolean>>,

  //These are assumed to remain constant, but included because they are chain-specific
  disconnect: () => Promise<any>,
  connect: () => Promise<any>,
  signChallenge: (challenge: string) => Promise<SignChallengeResponse>,
  signTxn: (txn: object, simulate: boolean) => Promise<any>,
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
  userInfo: BLANK_USER_INFO,
  setUserInfo: () => { },
  signChallenge: async () => { return {} },
  signTxn: async () => { },
  getPublicKey: async () => { return '' },
  ownedAssetIds: [],
  displayedResources: [],
  selectedChainInfo: {},
  incrementSequence: () => { },
  isRegistered: false,
  setIsRegistered: () => { },
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
  balance: 0,
  setBalance: () => { },
  updatePortfolioInfo: async (_address: string) => { },
  airdropped: false,
  setAirdropped: () => { },
});

type Props = {
  children?: React.ReactNode
};

export const ChainContextProvider: React.FC<Props> = ({ children }) => {
  const [chain, setChain] = useState<SupportedChain>(SupportedChain.ETH);


  const ethereumContext = useEthereumContext();
  const cosmosContext = useCosmosContext();


  useEffect(() => {
    if (chain === 'Ethereum') {
      ethereumContext.setChainId('eth');
    }
    // else if (chain === 'Polygon') {
    //     ethereumContext.setChainId('polygon');
    // } else if (chain === 'Avalanche') {
    //     ethereumContext.setChainId('avalanche');
    // } else if (chain === 'BSC') {
    //     ethereumContext.setChainId('bsc');
    // }
    // else if (chain === 'Algorand Mainnet') {
    //     algorandContext.setChainId('Mainnet');
    // } else if (chain === 'Algorand Testnet') {
    //     algorandContext.setChainId('Testnet');
    // }
  }, [chain, setChain, ethereumContext]);

  let currentChainContext: ChainSpecificContextType;
  if (chain?.startsWith('Cosmos')) {
    currentChainContext = cosmosContext;
  } else {
    currentChainContext = ethereumContext;
  }

  const chainContext: ChainContextType = {
    ...currentChainContext
  };

  return <ChainContext.Provider value={chainContext}>
    {children}
  </ChainContext.Provider>;
}


export const useChainContext = () => useContext(ChainContext);

