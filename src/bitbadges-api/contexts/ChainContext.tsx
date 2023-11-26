/* eslint-disable react-hooks/exhaustive-deps */
import { SupportedChain } from 'bitbadgesjs-utils';
import { PresetUri, SupportedChainMetadata } from 'blockin';
import { Dispatch, SetStateAction, createContext, useContext, useEffect, useState } from 'react';
import { useCosmosContext } from './chains/CosmosContext';
import { useEthereumContext } from './chains/EthereumContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { useSolanaContext } from './chains/SolanaContext';

export type SignChallengeResponse = {
  originalBytes?: Uint8Array;
  signatureBytes?: Uint8Array;
  message?: string;
}

export type ChainContextType = ChainSpecificContextType & {
  chain: SupportedChain,
  setChain: Dispatch<SetStateAction<SupportedChain>>,
}

export type ChainSpecificContextType = {
  address: string,
  setAddress: Dispatch<SetStateAction<string>>,

  cosmosAddress: string,
  setCosmosAddress: Dispatch<SetStateAction<string>>,

  loggedIn: boolean,
  setLoggedIn: Dispatch<SetStateAction<boolean>>,

  //Chain Specific
  connected: boolean,
  setConnected: Dispatch<SetStateAction<boolean>>,

  chainId: string,
  setChainId: Dispatch<SetStateAction<string>>,

  //These are assumed to remain constant, but included because they are chain-specific
  disconnect: () => Promise<any>,
  connect: () => Promise<any>,
  signChallenge: (challenge: string) => Promise<SignChallengeResponse>,
  signTxn: (txn: object, simulate: boolean) => Promise<any>,
  getPublicKey: (cosmosAddress: string) => Promise<string>,
  displayedResources: PresetUri[],
  selectedChainInfo: (SupportedChainMetadata & { getAddressForName?: (name: string) => Promise<string | undefined>; }) | undefined,
  ownedAssetIds: string[],

  lastSeenActivity: number,
  setLastSeenActivity: Dispatch<SetStateAction<number>>,
}

const ChainContext = createContext<ChainContextType>({
  address: '',
  setAddress: () => { },
  cosmosAddress: '',
  setCosmosAddress: () => { },
  connected: false,
  setConnected: () => { },
  loggedIn: false,
  setLoggedIn: () => { },
  connect: async () => { },
  disconnect: async () => { },
  chainId: '1',
  setChainId: async () => { },
  signChallenge: async () => { return {} },
  signTxn: async () => { },
  getPublicKey: async () => { return '' },
  ownedAssetIds: [],
  displayedResources: [],
  selectedChainInfo: {},
  chain: SupportedChain.ETH,
  setChain: () => { },

  lastSeenActivity: 0,
  setLastSeenActivity: () => { },
});

type Props = {
  children?: React.ReactNode
};

export const ChainContextProvider: React.FC<Props> = ({ children }) => {
  //TODO: default based on cookie of last signed in chain
  const [chain, setChain] = useState<SupportedChain>(SupportedChain.ETH);

  const ethereumContext = useEthereumContext();
  const cosmosContext = useCosmosContext();
  const solanaContext = useSolanaContext();

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: chainContext');

    if (chain === 'Ethereum') {
      ethereumContext.setChainId('eth');
    }
  }, [chain, setChain, ethereumContext]);

  let currentChainContext: ChainSpecificContextType;
  if (chain?.startsWith('Cosmos')) {
    currentChainContext = cosmosContext;
  } else if (chain?.startsWith('Solana')) {
    currentChainContext = solanaContext;
  } else {
    currentChainContext = ethereumContext;
  }

  const chainContext: ChainContextType = {
    ...currentChainContext,
    chain,
    setChain,
  };

  return <ChainContext.Provider value={chainContext}>
    {children}
  </ChainContext.Provider>;
}


export const useChainContext = () => useContext(ChainContext);

