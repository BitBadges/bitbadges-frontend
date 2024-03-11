import { createContext, useContext, useState } from 'react';

import { ChainSpecificContextType } from '../ChainContext';
import { ChainDefaultState } from './helpers';

export type Web2ContextType = ChainSpecificContextType & {
  setAddress: (address: string) => void;
  discord: {
    username: string;
    discriminator: string;
    id: string;
  };
  setDiscord: (discord: { username: string; discriminator: string; id: string }) => void;
};

export const Web2Context = createContext<Web2ContextType>({
  ...ChainDefaultState,
  discord: { username: '', discriminator: '', id: '' },
  setDiscord: () => {},
  setAddress: () => {}
});

interface Props {
  children?: React.ReactNode;
}

export const Web2ContextProvider: React.FC<Props> = ({ children }) => {
  const [address, setAddress] = useState('');
  const [discord, setDiscord] = useState({ username: '', discriminator: '', id: '' });

  const connect = async () => {};

  const disconnect = async () => {
    setAddress('');
  };

  const signChallenge = async () => {
    throw new Error('Not implemented');
  };

  const signTxn = async () => {
    throw new Error('Not implemented');
  };

  const getPublicKey = async (_cosmosAddress: string) => {
    return '';
  };


  const web2Context: Web2ContextType = {
    connect,
    disconnect,
    signChallenge,
    signTxn,
    address,
    setAddress,
    getPublicKey,
    discord,
    setDiscord
  };

  return <Web2Context.Provider value={web2Context}>{children}</Web2Context.Provider>;
};

export const useWeb2Context = () => useContext(Web2Context);
