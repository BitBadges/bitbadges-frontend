import {
  SigningStargateClient
} from "@cosmjs/stargate";
import { verifyADR36Amino } from '@keplr-wallet/cosmos';
import { AccountData, Window as KeplrWindow } from "@keplr-wallet/types";
import { createTxRaw } from 'bitbadgesjs-proto';
import { Numberify, convertToCosmosAddress } from 'bitbadgesjs-utils';
import { PresetResource, SupportedChainMetadata } from 'blockin';
import Long from 'long';
import { Dispatch, SetStateAction, createContext, useContext, useEffect, useRef, useState } from 'react';
import { useCookies } from 'react-cookie';
import { CHAIN_DETAILS, COSMOS_LOGO, HOSTNAME, INFINITE_LOOP_MODE } from '../../../constants';
import { useAccountsContext } from '../AccountsContext';
import { ChainSpecificContextType } from '../ChainContext';


declare global {
  interface Window extends KeplrWindow { }
}

const BitBadgesKeplrSuggestChainInfo = {
  chainId: "bitbadges_1-1",
  chainName: "bitbadges",
  rpc: `http://${HOSTNAME}:26657`,
  rest: `http://${HOSTNAME}:1317`,
  bip44: {
    coinType: 60,
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
  },
  coinType: 60,
  features: ["stargate", "eth-address-gen", "eth-key-sign"],
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
  chainId: 'Mainnet',
  setChainId: () => { },
  signChallenge: async () => { return {} },
  getPublicKey: async () => { return '' },
  signTxn: async () => { },
  ownedAssetIds: [],
  displayedResources: [],
  selectedChainInfo: {},
  connected: false,
  setConnected: () => { },
  loggedIn: false,
  setLoggedIn: () => { },
})


type Props = {
  children?: React.ReactNode
};

export const CosmosContextProvider: React.FC<Props> = ({ children }) => {
  const accountsContext = useAccountsContext();
  const accountsContextRef = useRef(accountsContext);

  const [address, setAddress] = useState<string>('')
  const [connected, setConnected] = useState<boolean>(false);
  const [chainId, setChainId] = useState<string>('bitbadges_1-1');
  const [signer, setSigner] = useState<SigningStargateClient>();
  const [cosmosAddress, setCosmosAddress] = useState<string>('');
  const [cookies] = useCookies(['blockincookie', 'pub_key']);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  const selectedChainInfo: SupportedChainMetadata = {
    name: 'Cosmos',
    logo: COSMOS_LOGO,
    abbreviation: 'COSM'
  };
  const displayedResources: PresetResource[] = []; //This can be dynamic based on Chain ID if you want to give different token addresses for different Chain IDs

  //If you would like to support this, you can call this with a useEffect every time connected or address is updated
  const ownedAssetIds: string[] = [];

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: cosmosContext');
    if (address) {
      setAddress(address);
      setCosmosAddress(convertToCosmosAddress(address));
      accountsContextRef.current.fetchAccountsWithOptions([{
        address: address,
        fetchSequence: true,
        fetchBalance: true,
        viewsToFetch: [{
          viewKey: 'badgesCollected',
          bookmark: '',
        }, {
          viewKey: 'latestActivity',
          bookmark: '',
        }, {
          viewKey: 'latestAnnouncements',
          bookmark: '',
        }, {
          viewKey: 'latestReviews',
          bookmark: '',
        }, {
          viewKey: 'addressMappings',
          bookmark: '',
        }]
      }]);
      setLoggedIn(cookies.blockincookie === convertToCosmosAddress(address));
      setConnected(true);
    } else {
      setConnected(false);
    }
  }, [address, cookies.blockincookie])

  const connect = async () => {
    const { keplr } = window
    if (!keplr || !window || !window.getOfflineSigner) {
      alert("You need to install Keplr")
      return
    }
    console.log('test')
    await keplr.experimentalSuggestChain(BitBadgesKeplrSuggestChainInfo)
    console.log('tet2')
    const offlineSigner = window.getOfflineSigner(chainId);
    const signingClient = await SigningStargateClient.connectWithSigner(
      `http://${HOSTNAME}:26657`,
      offlineSigner,
    )
    console.log('tet3')
    const account: AccountData = (await offlineSigner.getAccounts())[0]
    console.log('tet4')
    setSigner(signingClient);
    setConnected(true);
    setAddress(account.address);
  }

  const disconnect = async () => {
    setAddress('');
    setConnected(false);
  };

  const signChallenge = async (message: string) => {
    let sig = await window.keplr?.signArbitrary("bitbadges_1-1", cosmosAddress, message);

    if (!sig) sig = { signature: '', pub_key: { type: '', value: '' } };

    const signatureBuffer = Buffer.from(sig.signature, 'base64');
    const uint8Signature = new Uint8Array(signatureBuffer); // Convert the buffer to an Uint8Array
    const pubKeyValueBuffer = Buffer.from(sig.pub_key.value, 'base64'); // Decode the base64 encoded value
    const pubKeyUint8Array = new Uint8Array(pubKeyValueBuffer); // Convert the buffer to an Uint8Array

    const isRecovered = verifyADR36Amino('cosmos', cosmosAddress, message, pubKeyUint8Array, uint8Signature, 'ethsecp256k1');
    if (!isRecovered) {
      throw new Error('Signature verification failed');
    }
    const concat = Buffer.concat([pubKeyUint8Array, uint8Signature]);

    return { originalBytes: new Uint8Array(Buffer.from(`0x${Buffer.from(message, 'utf8').toString('hex')}`, 'utf8')), signatureBytes: new Uint8Array(concat), message: 'Success' }
  }

  const signTxn = async (txn: any, simulate: boolean) => {
    const account = accountsContext.getAccount(address);
    if (!account) {
      throw new Error('Account does not exist');
    }
    const chain = CHAIN_DETAILS;
    const sender = {
      accountAddress: cosmosAddress,
      sequence: account.sequence ? Numberify(account.sequence) : 0,
      accountNumber: Numberify(account.accountNumber),
      pubkey: account.publicKey,
    };
    await window.keplr?.enable(chainId);

    if (!simulate) {

      const signResponse = await window?.keplr?.signDirect(
        chain.cosmosChainId,
        sender.accountAddress,
        {
          bodyBytes: txn.signDirect.body.serializeBinary(),
          authInfoBytes: txn.signDirect.authInfo.serializeBinary(),
          chainId: chain.cosmosChainId,
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
    const chain = CHAIN_DETAILS;

    const account = await window?.keplr?.getKey(chain.cosmosChainId)
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
  };


  return <CosmosContext.Provider value={cosmosContext}>
    {children}
  </ CosmosContext.Provider>
}

export const useCosmosContext = () => useContext(CosmosContext)  