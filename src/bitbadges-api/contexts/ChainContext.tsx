/* eslint-disable react-hooks/exhaustive-deps */
import { BigIntify, BlockinChallengeParams, SupportedChain, TransactionPayload, TxContext, convertToCosmosAddress } from 'bitbadgesjs-sdk';
import { constructChallengeObjectFromString } from 'blockin';
import { Dispatch, SetStateAction, createContext, useContext, useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { INFINITE_LOOP_MODE } from '../../constants';
import { checkIfSignedIn } from '../api';
import { useBitcoinContext } from './chains/BitcoinContext';
import { useCosmosContext } from './chains/CosmosContext';
import { useEthereumContext } from './chains/EthereumContext';
import { useSolanaContext } from './chains/SolanaContext';
import { ChainDefaultState, fetchDefaultViews } from './chains/helpers';
import { useWeb2Context } from './chains/Web2Context';

export interface SignChallengeResponse {
  signature: string;
  message: string;
  publicKey?: string;
}

export type ChainContextType = ChainSpecificContextType & {
  chain: SupportedChain;
  setChain: Dispatch<SetStateAction<SupportedChain>>;

  cosmosAddress: string;

  challengeParams?: BlockinChallengeParams<bigint>;
  setChallengeParams: Dispatch<SetStateAction<BlockinChallengeParams<bigint> | undefined>>;

  loggedIn: boolean;
  connected: boolean;

  loggedInExpiration: number;

  lastSeenActivity: number;

  offChainOnlyMode: boolean;
  setOffChainOnlyMode: Dispatch<SetStateAction<boolean>>;
};

//These are assumed to remain constant, but included because they are chain-specific
export interface ChainSpecificContextType {
  address: string;
  disconnect: () => Promise<any>;
  connect: () => Promise<any>;
  signChallenge: (challenge: string) => Promise<SignChallengeResponse>;
  signTxn: (context: TxContext, payload: TransactionPayload, simulate: boolean) => Promise<string>; //Returns broadcast post body
  getPublicKey: (cosmosAddress: string) => Promise<string>;
}

const ChainContext = createContext<ChainContextType>({ ...ChainDefaultState });

interface Props {
  children?: React.ReactNode;
}

export const ChainContextProvider: React.FC<Props> = ({ children }) => {
  const [chain, setChain] = useState<SupportedChain>(SupportedChain.ETH);
  const [cookies, setCookies] = useCookies(['latestChain', 'blockincookie']);

  const [challengeParams, setChallengeParams] = useState<BlockinChallengeParams<bigint>>();
  const [lastSeenActivity, setLastSeenActivity] = useState<number>(0);
  const [offChainOnlyMode, setOffChainOnlyMode] = useState<boolean>(false);

  const ethereumContext = useEthereumContext();
  const cosmosContext = useCosmosContext();
  const solanaContext = useSolanaContext();
  const bitcoinContext = useBitcoinContext();
  const web2Context = useWeb2Context();

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

  if (offChainOnlyMode) {
    currentChainContext = web2Context;
  }

  const loggedInCookie = cookies.blockincookie === convertToCosmosAddress(currentChainContext.address);

  useEffect(() => {
    async function checkSignIn() {
      const signedInRes = await checkIfSignedIn({});
      if (signedInRes.message) {
        const params = constructChallengeObjectFromString(signedInRes.message, BigIntify);
        setChallengeParams(new BlockinChallengeParams<bigint>(params));

        web2Context.setAddress(params.address);
      }

      if (signedInRes.discord && signedInRes.discord.id && signedInRes.discord.username) {
        web2Context.setDiscord({
          id: signedInRes.discord.id,
          username: signedInRes.discord.username,
          discriminator: signedInRes.discord.discriminator
        });
      }
    }
    checkSignIn();
  }, []);

  const connected = currentChainContext.address !== '';
  const loggedIn = challengeParams?.address === currentChainContext.address && loggedInCookie;

  useEffect(() => {
    async function fetchViews(address: string, loggedIn: boolean) {
      if (loggedIn) {
        setLastSeenActivity(Date.now());
      }

      await fetchDefaultViews(address, loggedIn);
    }

    fetchViews(currentChainContext.address, loggedIn);
  }, [loggedIn, currentChainContext.address]);

  const chainContext: ChainContextType = {
    ...currentChainContext,
    connected: connected,
    lastSeenActivity,
    loggedIn: connected && loggedIn,
    challengeParams,
    setChallengeParams,
    loggedInExpiration: challengeParams?.expirationDate ? new Date(challengeParams.expirationDate).getTime() : 0,
    cosmosAddress: convertToCosmosAddress(currentChainContext.address),
    chain,
    setChain,
    offChainOnlyMode,
    setOffChainOnlyMode
  };

  return <ChainContext.Provider value={chainContext}>{children}</ChainContext.Provider>;
};

export const useChainContext = () => useContext(ChainContext);
