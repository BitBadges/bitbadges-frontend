/* eslint-disable react-hooks/exhaustive-deps */
import { SupportedChain, convertToCosmosAddress } from 'bitbadgesjs-utils';
import { SupportedChainMetadata } from 'blockin';
import { Dispatch, SetStateAction, createContext, useContext, useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { INFINITE_LOOP_MODE } from '../../constants';
import { useBitcoinContext } from './chains/BitcoinContext';
import { useCosmosContext } from './chains/CosmosContext';
import { useEthereumContext } from './chains/EthereumContext';
import { useSolanaContext } from './chains/SolanaContext';

export type SignChallengeResponse = {
  signature: string
  message: string;
}

export type ChainContextType = ChainSpecificContextType & {
  chain: SupportedChain,
  setChain: Dispatch<SetStateAction<SupportedChain>>,

  cosmosAddress: string,
}

export type ChainSpecificContextType = {
  address: string,

  loggedIn: boolean,
  setLoggedIn: Dispatch<SetStateAction<boolean>>,

  //Chain Specific
  connected: boolean,
  setConnected: Dispatch<SetStateAction<boolean>>,

  //These are assumed to remain constant, but included because they are chain-specific
  disconnect: () => Promise<any>,
  connect: () => Promise<any>,
  signChallenge: (challenge: string) => Promise<SignChallengeResponse>,
  signTxn: (txn: object, simulate: boolean) => Promise<any>,
  getPublicKey: (cosmosAddress: string) => Promise<string>,
  selectedChainInfo: (SupportedChainMetadata & { getAddressForName?: (name: string) => Promise<string | undefined>; }) | undefined,

  lastSeenActivity: number,
  setLastSeenActivity: Dispatch<SetStateAction<number>>
}

const ChainContext = createContext<ChainContextType>({
  address: '',
  connected: false,
  setConnected: () => { },
  loggedIn: false,
  cosmosAddress: '',
  setLoggedIn: () => { },
  connect: async () => { },
  disconnect: async () => { },
  signChallenge: async () => { return { message: '', signature: '' } },
  signTxn: async () => { },
  getPublicKey: async () => { return '' },
  selectedChainInfo: {},
  chain: SupportedChain.ETH,
  setChain: () => { },

  lastSeenActivity: 0,
  setLastSeenActivity: () => { }
});

type Props = {
  children?: React.ReactNode
};

export const ChainContextProvider: React.FC<Props> = ({ children }) => {
  const [chain, setChain] = useState<SupportedChain>(SupportedChain.ETH);
  const [cookies, setCookies] = useCookies(['latestChain']);

  const ethereumContext = useEthereumContext();
  const cosmosContext = useCosmosContext();
  const solanaContext = useSolanaContext();
  const bitcoinContext = useBitcoinContext();

  //Handle setting chain by default based on last signed in cookie
  useEffect(() => {
    if (cookies.latestChain) {
      setChain(cookies.latestChain);
    }
  }, []);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: chainContext');

    if (cookies.latestChain !== chain) {
      setCookies('latestChain', chain);
    }
  }, [chain]);

  let currentChainContext: ChainSpecificContextType;
  if (chain?.startsWith('Cosmos')) {
    currentChainContext = cosmosContext;
  } else if (chain?.startsWith('Solana')) {
    currentChainContext = solanaContext;
  } else if (chain?.startsWith('Bitcoin')) {
    currentChainContext = bitcoinContext;
  } else {
    currentChainContext = ethereumContext;
  }

  const chainContext: ChainContextType = {
    ...currentChainContext,
    cosmosAddress: convertToCosmosAddress(currentChainContext.address),
    chain,
    setChain,
  };

  return <ChainContext.Provider value={chainContext}>
    {children}
  </ChainContext.Provider>;
}


export const useChainContext = () => useContext(ChainContext);

