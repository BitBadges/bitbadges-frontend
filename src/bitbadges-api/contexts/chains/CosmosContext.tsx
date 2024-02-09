import { verifyADR36Amino } from '@keplr-wallet/cosmos';
import { AccountData, Window as KeplrWindow } from "@keplr-wallet/types";
import { BigIntify, TransactionPayload, TxContext, convertToCosmosAddress, createTxBroadcastBodyCosmos } from 'bitbadgesjs-sdk';
import { SupportedChainMetadata, constructChallengeObjectFromString } from 'blockin';
import Long from 'long';
import { createContext, useContext, useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { COSMOS_LOGO, INFINITE_LOOP_MODE, NODE_API_URL, RPC_URL } from '../../../constants';
import { checkIfSignedIn } from "../../api";

import { ChainSpecificContextType } from '../ChainContext';
import { useAccount } from "../accounts/AccountsContext";
import { fetchDefaultViews } from "./helpers";

declare global {
  interface Window extends KeplrWindow { }
}

const BitBadgesKeplrSuggestChainInfo = {
  chainId: "bitbadges_1-2",
  chainName: "BitBadges",
  chainSymbolImageUrl: "https://avatars.githubusercontent.com/u/86890740",
  coinImageUrl: "https://avatars.githubusercontent.com/u/86890740",
  rpc: RPC_URL,
  rest: NODE_API_URL,
  // rpc: 'https://node.bitbadges.io/rpc',
  // rest: 'https://node.bitbadges.io/api',
  bip44: {
    coinType: 118,
  },
  bech32Config: {
    bech32PrefixAccAddr: "cosmos",
    bech32PrefixAccPub: "cosmos" + "pub",
    bech32PrefixValAddr: "cosmos" + "valoper",
    bech32PrefixValPub: "cosmos" + "valoperpub",
    bech32PrefixConsAddr: "cosmos" + "valcons",
    bech32PrefixConsPub: "cosmos" + "valconspub",
  },
  currencies: [
    {
      coinDenom: "BADGE",
      coinMinimalDenom: "badge",
      coinDecimals: 0,
      coinGeckoId: "cosmos",
      coinImageUrl: "https://avatars.githubusercontent.com/u/86890740",
    },
  ],
  feeCurrencies: [
    {
      coinDenom: "BADGE",
      coinMinimalDenom: "badge",
      coinDecimals: 0,
      coinGeckoId: "cosmos",
      gasPriceStep: {
        low: 0.000000000001,
        average: 0.000000000001,
        high: 0.000000000001,
      },
      coinImageUrl: "https://avatars.githubusercontent.com/u/86890740",
    },
  ],
  stakeCurrency: {
    coinDenom: "BADGE",
    coinMinimalDenom: "badge",
    coinDecimals: 0,
    coinGeckoId: "cosmos",
    coinImageUrl: "https://avatars.githubusercontent.com/u/86890740",
  }
}

export type CosmosContextType = ChainSpecificContextType & {}

export const CosmosContext = createContext<CosmosContextType>({
  address: '',
  connect: async () => { },
  disconnect: async () => { },
  signChallenge: async () => { return { message: '', signature: '' } },
  getPublicKey: async () => { return '' },
  signTxn: async () => { return '' },
  selectedChainInfo: {},
  connected: false,
  setConnected: () => { },
  loggedIn: false,
  setLoggedIn: () => { },
  lastSeenActivity: 0,
  setLastSeenActivity: () => { },
  loggedInExpiration: 0,
})


type Props = {
  children?: React.ReactNode
};

export const CosmosContextProvider: React.FC<Props> = ({ children }) => {
  const chainId = 'bitbadges_1-2';

  const [address, setAddress] = useState<string>('')
  const [connected, setConnected] = useState<boolean>(false);
  const [cosmosAddress, setCosmosAddress] = useState<string>('');
  const [cookies] = useCookies(['blockincookie', 'pub_key']);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [lastSeenActivity, setLastSeenActivity] = useState<number>(0);
  const [loggedInExpiration, setLoggedInExpiration] = useState<number>(0);
  const account = useAccount(address)

  const selectedChainInfo: SupportedChainMetadata = {
    name: 'Cosmos',
    logo: COSMOS_LOGO,
    abbreviation: 'COSM'
  };

  useEffect(() => {
    async function fetchDetails() {
      if (INFINITE_LOOP_MODE) console.log('useEffect: cosmosContext');
      if (address) {
        setAddress(address);
        setCosmosAddress(convertToCosmosAddress(address));

        let loggedIn = false;
        if (cookies.blockincookie === convertToCosmosAddress(address)) {
          const signedInRes = await checkIfSignedIn({});
          setLoggedIn(signedInRes.signedIn);
          loggedIn = signedInRes.signedIn;
          if (signedInRes.message) {
            const params = constructChallengeObjectFromString(signedInRes.message, BigIntify)
            setLoggedInExpiration(params.expirationDate ? new Date(params.expirationDate).getTime() : 0);
          }
        }


        if (loggedIn) {
          setLastSeenActivity(Date.now());
        }

        await fetchDefaultViews(address, loggedIn);
        setLoggedIn(cookies.blockincookie === convertToCosmosAddress(address));
        setConnected(true);
      } else {
        setConnected(false);
      }
    }
    fetchDetails();
  }, [address, cookies.blockincookie, loggedIn])

  const connect = async () => {
    const { keplr } = window
    if (!keplr || !window || !window.getOfflineSigner) {
      alert("Please install Keplr to continue with Cosmos")
      return
    }

    await keplr.experimentalSuggestChain(BitBadgesKeplrSuggestChainInfo)
    const offlineSigner = window.getOfflineSigner(chainId);
    // const signingClient = await SigningStargateClient.connectWithSigner(
    //   RPC_URL,
    //   offlineSigner,
    // )
    const account: AccountData = (await offlineSigner.getAccounts())[0]
    // setSigner(signingClient);
    setConnected(true);
    setAddress(account.address);
  }

  const disconnect = async () => {
    setAddress('');
    setConnected(false);
  };

  const signChallenge = async (message: string) => {
    let sig = await window.keplr?.signArbitrary("bitbadges_1-2", cosmosAddress, message);

    if (!sig) sig = { signature: '', pub_key: { type: '', value: '' } };

    const signatureBuffer = Buffer.from(sig.signature, 'base64');
    const uint8Signature = new Uint8Array(signatureBuffer); // Convert the buffer to an Uint8Array
    const pubKeyValueBuffer = Buffer.from(sig.pub_key.value, 'base64'); // Decode the base64 encoded value
    const pubKeyUint8Array = new Uint8Array(pubKeyValueBuffer); // Convert the buffer to an Uint8Array

    const isRecovered = verifyADR36Amino('cosmos', cosmosAddress, message, pubKeyUint8Array, uint8Signature, 'secp256k1');
    if (!isRecovered) {
      throw new Error('Signature verification failed');
    }

    return {
      message: message,
      signature: sig.signature,
      publicKey: sig.pub_key.value,
    }
  }

  const signTxn = async (context: TxContext, payload: TransactionPayload, simulate: boolean) => {
    if (!account) {
      throw new Error('Account does not exist');
    }
    const { sender } = context;
    await window.keplr?.enable(chainId);

    let signatures = [
      new Uint8Array(Buffer.from('0x', 'hex')),
    ]
    if (!simulate) {
      const signResponse = await window?.keplr?.signDirect(
        chainId,
        sender.accountAddress,
        {
          bodyBytes: payload.signDirect.body.toBinary(),
          authInfoBytes: payload.signDirect.authInfo.toBinary(),
          chainId: chainId,
          accountNumber: new Long(sender.accountNumber),
        },
        {
          preferNoSetFee: true,
        }
      )

      if (!signResponse) {
        throw new Error('No signature returned from Keplr');
      }

      signatures = [
        new Uint8Array(Buffer.from(signResponse.signature.signature, 'base64')),
      ]
    }

    const txBody = createTxBroadcastBodyCosmos(payload, signatures);
    return txBody;
  }


  const getPublicKey = async (_cosmosAddress: string) => {
    const account = await window?.keplr?.getKey(chainId)
    if (!account) return '';

    const pk = Buffer.from(account.pubKey).toString('base64')

    return pk;
  }

  const cosmosContext: CosmosContextType = {
    connected,
    setConnected,
    connect,
    disconnect,
    selectedChainInfo,
    signChallenge,
    signTxn,
    address,
    getPublicKey,
    loggedIn,
    setLoggedIn,
    lastSeenActivity,
    setLastSeenActivity,
    loggedInExpiration,
  };


  return <CosmosContext.Provider value={cosmosContext}>
    {children}
  </ CosmosContext.Provider>
}

export const useCosmosContext = () => useContext(CosmosContext)


