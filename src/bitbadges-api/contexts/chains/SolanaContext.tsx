import { notification } from 'antd';
import { TransactionPayload, TxContext, convertToCosmosAddress, createTxBroadcastBody } from 'bitbadgesjs-sdk';
import { createContext, useContext, useState } from 'react';
import { useCookies } from 'react-cookie';
import { ChainSpecificContextType } from '../ChainContext';
import { useAccount } from '../accounts/AccountsContext';
import { ChainDefaultState } from './helpers';
import CryptoJS from 'crypto-js';

const bs58 = require('bs58');

export type SolanaContextType = ChainSpecificContextType;
export const SolanaContext = createContext<SolanaContextType>({ ...ChainDefaultState });

interface Props {
  children?: React.ReactNode;
}

export const SolanaContextProvider: React.FC<Props> = ({ children }) => {
  const [, setCookies] = useCookies(['pub_key']);
  const [pubKey, setPubKey] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const cosmosAddress = convertToCosmosAddress(address);
  const account = useAccount(cosmosAddress);

  const getProvider = () => {
    if ('phantom' in window) {
      const phantomWindow = window as any;
      const provider = phantomWindow.phantom?.solana;
      if (provider?.isPhantom) {
        return provider;
      }

      window.open('https://phantom.app/', '_blank');
    }
  };

  const connect = async () => {
    if (!address) {
      try {
        const provider = getProvider(); // see "Detecting the Provider"

        const resp = await provider.request({ method: 'connect' });
        const address = resp.publicKey.toBase58();
        const pubKey = resp.publicKey.toBase58();
        const cosmosAddress = convertToCosmosAddress(address);
        setAddress(address);

        const solanaPublicKeyBase58 = pubKey;
        const solanaPublicKeyBuffer = bs58.decode(solanaPublicKeyBase58);
        const publicKeyToSet = Buffer.from(solanaPublicKeyBuffer).toString('base64');
        setPubKey(publicKeyToSet);
        setCookies('pub_key', `${cosmosAddress}-${publicKeyToSet}`, { path: '/' });
      } catch (e) {
        console.error(e);
        notification.error({
          message: 'Error connecting to wallet',
          description: 'Make sure you have Phantom installed and are logged in.'
        });
      }
    }
  };

  const disconnect = async () => {
    setAddress('');
    await getProvider()?.request({ method: 'disconnect' });
  };

  const signChallenge = async (message: string) => {
    const encodedMessage = new TextEncoder().encode(message);
    const provider = getProvider();
    const signedMessage = await provider.request({
      method: 'signMessage',
      params: {
        message: encodedMessage,
        display: 'utf8'
      }
    });

    return { message: message, signature: signedMessage.signature.toString('hex') };
  };

  const signTxn = async (context: TxContext, payload: TransactionPayload, simulate: boolean) => {
    if (!account) throw new Error('Account not found.');

    let sig = '';
    if (!simulate) {
      //Phantom has a weird error where messages must be < ~1000 bytes
      //If we are within limit, we can have user sign the JSON
      //Else, we hash the JSON and have user sign the hash

      const normalMessage = payload.jsonToSign.length < 1000;
      let message = payload.jsonToSign;
      let encodedMessage = new TextEncoder().encode(message);

      if (!normalMessage) {
        notification.warn({
          message: 'Message Length Warning',
          description: `This transaction message is very large, and Solana has a limit of ~1000 characters for messages it can sign.
            We will use an alternative method to sign this message (hashing). You will see a series of numbers and letters to sign instead.`
        });

        message = payload.jsonToSign;
        const sha256Message = CryptoJS.SHA256(message).toString();
        encodedMessage = new TextEncoder().encode(sha256Message);
      }

      const signedMessage = await getProvider().request({
        method: 'signMessage',
        params: {
          message: encodedMessage,
          display: 'utf8'
        }
      });
      sig = signedMessage.signature.toString('hex');
    }

    //We need to pass in solAddress manually here
    const txBody = createTxBroadcastBody(context, payload, sig, address);
    return txBody;
  };

  const getPublicKey = async () => {
    return pubKey;
  };

  const solanaContext: SolanaContextType = {
    connect,
    disconnect,
    signChallenge,
    signTxn,
    address,
    getPublicKey
  };

  return <SolanaContext.Provider value={solanaContext}>{children}</SolanaContext.Provider>;
};

export const useSolanaContext = () => useContext(SolanaContext);
