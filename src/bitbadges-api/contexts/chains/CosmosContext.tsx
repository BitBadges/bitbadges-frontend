import { verifyADR36Amino } from '@keplr-wallet/cosmos';
import { AccountData, Window as KeplrWindow } from '@keplr-wallet/types';
import { BitBadgesKeplrSuggestBetanetChainInfo, TransactionPayload, TxContext, createTxBroadcastBody } from 'bitbadgesjs-sdk';
import Long from 'long';
import { createContext, useContext, useState } from 'react';
import { NODE_API_URL, RPC_URL } from '../../../constants';

import { ChainSpecificContextType } from '../ChainContext';
import { useAccount } from '../accounts/AccountsContext';
import { ChainDefaultState } from './helpers';

declare global {
  interface Window extends KeplrWindow {}
}

const BitBadgesKeplrSuggestChainInfo = {
  ...BitBadgesKeplrSuggestBetanetChainInfo,
  rpc: RPC_URL,
  rest: NODE_API_URL
};

export type CosmosContextType = ChainSpecificContextType;
export const CosmosContext = createContext<CosmosContextType>({ ...ChainDefaultState });

interface Props {
  children?: React.ReactNode;
}

const chainId = BitBadgesKeplrSuggestBetanetChainInfo.chainId;

export const CosmosContextProvider: React.FC<Props> = ({ children }) => {
  const [address, setAddress] = useState<string>('');
  const account = useAccount(address);

  const connect = async () => {
    const { keplr } = window;
    if (!keplr || !window || !window.getOfflineSigner) {
      alert('Please install Keplr to continue with Cosmos');
      return;
    }

    await keplr.experimentalSuggestChain(BitBadgesKeplrSuggestChainInfo);
    const offlineSigner = window.getOfflineSigner(chainId);
    const account: AccountData = (await offlineSigner.getAccounts())[0];
    setAddress(account.address);
  };

  const disconnect = async () => {
    setAddress('');
  };

  const signChallenge = async (message: string) => {
    let sig = await window.keplr?.signArbitrary('bitbadges_1-2', address, message);

    if (!sig) sig = { signature: '', pub_key: { type: '', value: '' } };

    const signatureBuffer = Buffer.from(sig.signature, 'base64');
    const uint8Signature = new Uint8Array(signatureBuffer); // Convert the buffer to an Uint8Array
    const pubKeyValueBuffer = Buffer.from(sig.pub_key.value, 'base64'); // Decode the base64 encoded value
    const pubKeyUint8Array = new Uint8Array(pubKeyValueBuffer); // Convert the buffer to an Uint8Array

    const isRecovered = verifyADR36Amino('cosmos', address, message, pubKeyUint8Array, uint8Signature, 'secp256k1');
    if (!isRecovered) {
      throw new Error('Signature verification failed');
    }

    return {
      message: message,
      signature: sig.signature,
      publicKey: sig.pub_key.value
    };
  };

  const signTxn = async (context: TxContext, payload: TransactionPayload, simulate: boolean) => {
    if (!account) {
      throw new Error('Account does not exist');
    }
    const { sender } = context;
    await window.keplr?.enable(chainId);

    let signatures = [new Uint8Array(Buffer.from('0x', 'hex'))];
    if (!simulate) {
      const signResponse = await window?.keplr?.signDirect(
        chainId,
        sender.accountAddress,
        {
          bodyBytes: payload.signDirect.body.toBinary(),
          authInfoBytes: payload.signDirect.authInfo.toBinary(),
          chainId: chainId,
          accountNumber: new Long(sender.accountNumber)
        },
        {
          preferNoSetFee: true
        }
      );

      if (!signResponse) {
        throw new Error('No signature returned from Keplr');
      }

      signatures = [new Uint8Array(Buffer.from(signResponse.signature.signature, 'base64'))];
    }

    const hexSig = Buffer.from(signatures[0]).toString('hex');

    const txBody = createTxBroadcastBody(context, payload, hexSig);
    return txBody;
  };

  const getPublicKey = async () => {
    const account = await window?.keplr?.getKey(chainId);
    if (!account) return '';

    return Buffer.from(account.pubKey).toString('base64');
  };

  const cosmosContext: CosmosContextType = {
    connect,
    disconnect,
    signChallenge,
    signTxn,
    address,
    getPublicKey
  };

  return <CosmosContext.Provider value={cosmosContext}>{children}</CosmosContext.Provider>;
};

export const useCosmosContext = () => useContext(CosmosContext);
