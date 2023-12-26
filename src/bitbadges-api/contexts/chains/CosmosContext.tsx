import {
  SigningStargateClient
} from "@cosmjs/stargate";
import { verifyADR36Amino } from '@keplr-wallet/cosmos';
import { AccountData, Window as KeplrWindow } from "@keplr-wallet/types";
import { createTxRaw } from 'bitbadgesjs-proto';
import { AccountViewKey, Numberify, convertToCosmosAddress } from 'bitbadgesjs-utils';
import { PresetUri, SupportedChainMetadata } from 'blockin';
import Long from 'long';
import { Dispatch, SetStateAction, createContext, useContext, useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { COSMOS_LOGO, HOSTNAME, INFINITE_LOOP_MODE, NODE_API_URL, RPC_URL } from '../../../constants';
import { checkIfSignedIn } from "../../api";

import { ChainSpecificContextType } from '../ChainContext';
import { fetchAccountsWithOptions, useAccount } from "../accounts/AccountsContext";
declare global {
  interface Window extends KeplrWindow { }
}

const BitBadgesKeplrSuggestChainInfo = {
  chainId: "bitbadges_1-2",
  chainName: "BitBadges",
  chainSymbolImageUrl: "https://avatars.githubusercontent.com/u/86890740",
  rpc: RPC_URL,
  rest: NODE_API_URL,
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
    },
  ],
  stakeCurrency: {
    coinDenom: "BADGE",
    coinMinimalDenom: "badge",
    coinDecimals: 0,
    coinGeckoId: "cosmos",
  }
}

export type CosmosContextType = ChainSpecificContextType & {
  signer?: SigningStargateClient;
  setSigner: Dispatch<SetStateAction<SigningStargateClient | undefined>>;
}

export const CosmosContext = createContext<CosmosContextType>({
  signer: undefined,
  setSigner: () => { },
  address: '',
  setAddress: () => { },
  cosmosAddress: '',
  setCosmosAddress: () => { },
  connect: async () => { },
  disconnect: async () => { },
  chainId: 'bitbadges_1-2',
  setChainId: () => { },
  signChallenge: async () => { return { message: '', signature: '' } },
  getPublicKey: async () => { return '' },
  signTxn: async () => { },
  ownedAssetIds: [],
  displayedResources: [],
  selectedChainInfo: {},
  connected: false,
  setConnected: () => { },
  loggedIn: false,
  setLoggedIn: () => { },
  lastSeenActivity: 0,
  setLastSeenActivity: () => { },
})


type Props = {
  children?: React.ReactNode
};

export const CosmosContextProvider: React.FC<Props> = ({ children }) => {


  const [address, setAddress] = useState<string>('')
  const [connected, setConnected] = useState<boolean>(false);
  const [chainId, setChainId] = useState<string>('bitbadges_1-2');
  const [signer, setSigner] = useState<SigningStargateClient>();
  const [cosmosAddress, setCosmosAddress] = useState<string>('');
  const [cookies] = useCookies(['blockincookie', 'pub_key']);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [lastSeenActivity, setLastSeenActivity] = useState<number>(0);
  const account = useAccount(address)

  const selectedChainInfo: SupportedChainMetadata = {
    name: 'Cosmos',
    logo: COSMOS_LOGO,
    abbreviation: 'COSM'
  };
  const displayedResources: PresetUri[] = []; //This can be dynamic based on Chain ID if you want to give different token addresses for different Chain IDs

  //If you would like to support this, you can call this with a useEffect every time connected or address is updated
  const ownedAssetIds: string[] = [];

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
        }
        const viewsToFetch: { viewType: AccountViewKey; viewId: string, bookmark: string; }[] = [{
          viewType: 'badgesCollected',
          viewId: 'badgesCollected',
          bookmark: '',
        }, {
          viewType: 'latestActivity',
          viewId: 'latestActivity',
          bookmark: '',
        }, {
          viewType: 'listsActivity',
          viewId: 'listsActivity',
          bookmark: '',
        },{
          viewType: 'latestAnnouncements',
          viewId: 'latestAnnouncements',
          bookmark: '',
    
        }, {
          viewType: 'latestReviews',
          viewId: 'latestReviews',
          bookmark: '',
        }, {
          viewType: 'addressMappings',
          viewId: 'addressMappings',
          bookmark: '',
        }, {
          viewType: 'explicitlyIncludedAddressMappings',
          viewId: 'explicitlyIncludedAddressMappings',
          bookmark: ''
        },
        {
          viewType: 'explicitlyExcludedAddressMappings',
          viewId: 'explicitlyExcludedAddressMappings',
          bookmark: ''
        }]

        if (loggedIn) {
          viewsToFetch.push({
            viewType: 'latestClaimAlerts',
            viewId: 'latestClaimAlerts',
            bookmark: '',
          }, {
            viewType: 'latestAddressMappings',
            viewId: 'latestAddressMappings',
            bookmark: ''
          },
            {
              viewType: 'authCodes',
              viewId: 'authCodes',
              bookmark: '',
            })
          setLastSeenActivity(Date.now());
        }

        fetchAccountsWithOptions([{
          address: address,
          fetchSequence: true,
          fetchBalance: true,
          viewsToFetch: viewsToFetch
        }]);
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
    const signingClient = await SigningStargateClient.connectWithSigner(
      `http://${HOSTNAME}:26657`,
      offlineSigner,
    )
    const account: AccountData = (await offlineSigner.getAccounts())[0]
    setSigner(signingClient);
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
      signature: sig.pub_key.value + ':' + sig.signature,
    }
  }

  const signTxn = async (txn: any, simulate: boolean) => {
    if (!account) {
      throw new Error('Account does not exist');
    }
    const sender = {
      accountAddress: cosmosAddress,
      sequence: account.sequence ? Numberify(account.sequence) : 0,
      accountNumber: Numberify(account.accountNumber),
      pubkey: account.publicKey,
    };
    await window.keplr?.enable(chainId);

    if (!simulate) {
      const signResponse = await window?.keplr?.signDirect(
        chainId,
        sender.accountAddress,
        {
          bodyBytes: txn.signDirect.body.serializeBinary(),
          authInfoBytes: txn.signDirect.authInfo.serializeBinary(),
          chainId: chainId,
          accountNumber: new Long(sender.accountNumber),
        },
        {
          preferNoSetFee: true,
        }
      )

      if (!signResponse) {
        return;
      }

      const signatures = [
        new Uint8Array(Buffer.from(signResponse.signature.signature, 'base64')),
      ]

      const { signed } = signResponse;

      const signedTx = createTxRaw(
        signed.bodyBytes,
        signed.authInfoBytes,
        signatures,
      )

      return signedTx;
    } else {
      const simulatedTx = createTxRaw(
        txn.signDirect.body.serializeBinary(),
        txn.signDirect.authInfo.serializeBinary(),
        [
          new Uint8Array(Buffer.from('0x', 'hex')),
        ],
      )

      return simulatedTx;
    }
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
    chainId,
    setChainId,
    connect,
    disconnect,
    ownedAssetIds,
    selectedChainInfo,
    displayedResources,
    signChallenge,
    signTxn,
    address,
    setAddress,
    signer,
    setSigner,
    getPublicKey,
    cosmosAddress,
    setCosmosAddress,
    loggedIn,
    setLoggedIn,
    lastSeenActivity,
    setLastSeenActivity,
  };


  return <CosmosContext.Provider value={cosmosContext}>
    {children}
  </ CosmosContext.Provider>
}

export const useCosmosContext = () => useContext(CosmosContext)  