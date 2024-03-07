import { Secp256k1 } from '@cosmjs/crypto';
import { disconnect as disconnectWeb3, signMessage, signTypedData } from '@wagmi/core';
import { useWeb3Modal } from '@web3modal/wagmi/react';

import { notification } from 'antd';
import { TransactionPayload, TxContext, convertToCosmosAddress, createTxBroadcastBody } from 'bitbadgesjs-sdk';
import { ethers } from 'ethers';
import { createContext, useContext } from 'react';
import { useCookies } from 'react-cookie';
import { useAccount as useWeb3Account } from 'wagmi';

import { ChainSpecificContextType } from '../ChainContext';
import { setPublicKey, useAccount } from '../accounts/AccountsContext';
import { ChainDefaultState } from './helpers';

export type EthereumContextType = ChainSpecificContextType;
export const EthereumContext = createContext<EthereumContextType>({ ...ChainDefaultState });

interface Props {
  children?: React.ReactNode;
}

export const EthereumContextProvider: React.FC<Props> = ({ children }) => {
  const [cookies, setCookies] = useCookies(['blockincookie', 'pub_key']);
  const { open } = useWeb3Modal();
  const web3AccountContext = useWeb3Account();
  const address = web3AccountContext.address || '';
  const cosmosAddress = convertToCosmosAddress(address);
  const account = useAccount(cosmosAddress);

  const connect = async () => {
    if (!address) {
      try {
        await open();
      } catch (e) {
        notification.error({
          message: 'Error connecting to wallet',
          description: 'Make sure you have a compatible Ethereum wallet installed (such as MetaMask) and that you are signed in to it.'
        });
      }
    }
  };

  const disconnect = async () => {
    await disconnectWeb3();
  };

  const signChallenge = async (message: string) => {
    const sign = await signMessage({
      message: message
    });

    const msgHash = ethers.utils.hashMessage(message);
    const msgHashBytes = ethers.utils.arrayify(msgHash);
    const pubKey = ethers.utils.recoverPublicKey(msgHashBytes, sign);

    const pubKeyHex = pubKey.substring(2);
    const compressedPublicKey = Secp256k1.compressPubkey(new Uint8Array(Buffer.from(pubKeyHex, 'hex')));
    const base64PubKey = Buffer.from(compressedPublicKey).toString('base64');
    setPublicKey(cosmosAddress, base64PubKey);
    setCookies('pub_key', `${cosmosAddress}-${base64PubKey}`, { path: '/' });

    return {
      message,
      signature: sign
    };
  };

  const signTxn = async (context: TxContext, payload: TransactionPayload, simulate: boolean) => {
    if (!account) throw new Error('Account not found.');

    let sig = '';
    if (!simulate) {
      sig = await signTypedData({
        message: payload.eipToSign.message as any,
        types: payload.eipToSign.types as any,
        domain: payload.eipToSign.domain,
        primaryType: payload.eipToSign.primaryType
      });
    }

    const txBody = createTxBroadcastBody(context, payload, sig);
    return txBody;
  };

  const getPublicKey = async (_cosmosAddress: string) => {
    try {
      const currAccount = account;

      //If we have stored the public key in cookies, use that instead (for Ethereum)
      if (currAccount && cookies.pub_key && cookies.pub_key.split('-')[0] === currAccount.cosmosAddress) {
        return cookies.pub_key.split('-')[1];
      }

      if (currAccount?.publicKey) {
        return currAccount.publicKey;
      }

      const message =
        "Hello! We noticed that you haven't interacted the BitBadges blockchain yet. To interact with the BitBadges blockchain, we need your PUBLIC key for your address to allow us to generate transactions.\n\nPlease kindly sign this message to allow us to compute your public key.\n\nThis message is not a blockchain transaction and signing this message has no purpose other than to compute your public key.\n\nThanks for your understanding!";

      const sig = await signMessage({
        message: message
      });

      const msgHash = ethers.utils.hashMessage(message);
      const msgHashBytes = ethers.utils.arrayify(msgHash);
      const pubKey = ethers.utils.recoverPublicKey(msgHashBytes, sig);

      const pubKeyHex = pubKey.substring(2);
      const compressedPublicKey = Secp256k1.compressPubkey(new Uint8Array(Buffer.from(pubKeyHex, 'hex')));
      const base64PubKey = Buffer.from(compressedPublicKey).toString('base64');
      setPublicKey(_cosmosAddress, base64PubKey);
      setCookies('pub_key', `${_cosmosAddress}-${base64PubKey}`, { path: '/' });

      return base64PubKey;
    } catch (e) {
      console.log(e);
      return '';
    }
  };

  const ethereumContext: EthereumContextType = {
    connect,
    disconnect,
    signChallenge,
    signTxn,
    address,
    getPublicKey
  };

  return <EthereumContext.Provider value={ethereumContext}>{children}</EthereumContext.Provider>;
};

export const useEthereumContext = () => useContext(EthereumContext);
