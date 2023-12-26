
import { notification } from 'antd';
import { SupportedChain, createTxRawEIP712, signatureToWeb3ExtensionBitcoin } from 'bitbadgesjs-proto';
import { AccountViewKey, Numberify, convertToCosmosAddress } from 'bitbadgesjs-utils';
import { PresetUri } from 'blockin';
import { Dispatch, SetStateAction, createContext, useCallback, useContext, useState } from 'react';
import { useCookies } from 'react-cookie';
import { BITCOIN_LOGO, CHAIN_DETAILS } from '../../../constants';
import { checkIfSignedIn } from '../../api';
import { ChainSpecificContextType } from '../ChainContext';
import { fetchAccountsWithOptions, useAccount } from '../accounts/AccountsContext';

export type BitcoinContextType = ChainSpecificContextType & {
  bitcoinProvider: any;
  setBitcoinProvider: Dispatch<SetStateAction<any | undefined>>;
}

export const BitcoinContext = createContext<BitcoinContextType>({
  address: '',
  setAddress: () => { },
  cosmosAddress: '',
  setCosmosAddress: () => { },
  connect: async () => { },
  disconnect: async () => { },
  chainId: 'Mainnet',
  setChainId: () => { },
  signChallenge: async () => { return { message: '', signature: '' } },
  getPublicKey: async () => { return '' },
  signTxn: async () => { },
  ownedAssetIds: [],
  displayedResources: [],
  selectedChainInfo: {},
  connected: false,
  setConnected: () => { },
  bitcoinProvider: undefined,
  setBitcoinProvider: () => { },
  loggedIn: false,
  setLoggedIn: () => { },
  lastSeenActivity: 0,
  setLastSeenActivity: () => { },
})

type Props = {
  children?: React.ReactNode
};

export const BitcoinContextProvider: React.FC<Props> = ({ children }) => {
  const [chainId, setChainId] = useState<string>('Mainnet');
  const [cookies, setCookies] = useCookies(['blockincookie', 'pub_key']);

  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [lastSeenActivity, setLastSeenActivity] = useState<number>(0);
  const [bitcoinProvider, setBitcoinProvider] = useState<any>();
  const [pubKey, setPubKey] = useState<string>('');

  const [address, setAddress] = useState<string>('');
  const cosmosAddress = convertToCosmosAddress(address);
  const connected = address ? true : false;
  const setConnected = () => { }
  const account = useAccount(cosmosAddress)

  const getProvider = () => {

    if ('phantom' in window) {
      const phantomWindow = window as any;
      const provider = phantomWindow.phantom?.bitcoin;
      setBitcoinProvider(provider);
      if (provider?.isPhantom) {
        return provider;
      }

      window.open('https://phantom.app/', '_blank');
    }
  };

  const selectedChainInfo = {
    name: 'Bitcoin',
    logo: BITCOIN_LOGO,
    abbreviation: 'BTC',
    getAddressExplorerUrl: (address: string) => `https://www.blockchain.com/btc/address/${address}`,
  }
  const displayedResources: PresetUri[] = []; //This can be dynamic based on Chain ID if you want to give different token addresses for different Chain IDs

  //If you would like to support this, you can call this with a useEffect every time connected or address is updated
  const ownedAssetIds: string[] = [];

  const connect = async () => {
    await connectAndPopulate(address ?? '', cookies.blockincookie);
  }

  const connectAndPopulate = useCallback(async (address: string, cookie: string) => {
    const DefaultViewsToFetch: { viewType: AccountViewKey; viewId: string, bookmark: string; }[] = [{
      viewType: 'badgesCollected',
      viewId: 'badgesCollected',
      bookmark: '',
    }, {
      viewType: 'latestActivity',
      viewId: 'latestActivity',
      bookmark: '',
    }, {
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

    if (!address) {
      try {
        const provider = getProvider(); // see "Detecting the Provider"

        const accounts = await provider.requestAccounts();
        if (accounts.length === 0) {
          throw new Error("No account found");
        }

        const address = accounts[0].address;
        console.log(accounts[0]);
        if (accounts[0].addressType !== 'p2wpkh') {
          throw new Error("Invalid account type");
        }
        


        // console.log(resp.publicKey.toString());
        // console.log(resp.publicKey.toBase58());
        // const cosmosAddress = convertToCosmosAddress(address);

        setBitcoinProvider(provider);
        setAddress(address);

        const publicKey = accounts[0].publicKey; //Hex public key
        const base64PublicKey = Buffer.from(publicKey, 'hex').toString('base64');
        setPubKey(base64PublicKey);

        setCookies('pub_key', `${cosmosAddress}-${base64PublicKey}`, { path: '/' });

        let loggedIn = false;
        if (cookie === convertToCosmosAddress(address)) {
          const signedInRes = await checkIfSignedIn({});
          setLoggedIn(signedInRes.signedIn);
          loggedIn = signedInRes.signedIn;
        } else {
          setLoggedIn(false);
        }

        const viewsToFetch = DefaultViewsToFetch.slice();

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

        await fetchAccountsWithOptions([{
          address: address,
          fetchSequence: true,
          fetchBalance: true,
          viewsToFetch
        }]);
      } catch (e) {
        console.log(e);
        notification.error({
          message: 'Error connecting to wallet',
          description: 'Make sure you have Phantom installed and are logged in.'
        })
      }
    }
  }, [setCookies]);


  const disconnect = async () => {
    setLoggedIn(false);
    setAddress('');
  };
  function bytesToBase64(bytes: Uint8Array) {
    const binString = String.fromCodePoint(...bytes);
    return btoa(binString);
  }

  const signChallenge = async (message: string) => {
    const encodedMessage = new TextEncoder().encode(message);
    const provider = bitcoinProvider;
    const { signature } = await provider.signMessage(address, encodedMessage);

    

    return { message: message, signature: bytesToBase64(signature) };
  }

  const signTxn = async (txn: any, simulate: boolean) => {
    if (!account) throw new Error('Account not found.');

    const chain = { ...CHAIN_DETAILS, chain: "Bitcoin" as SupportedChain } //SupportedChain.BTC };
    const sender = {
      accountAddress: cosmosAddress,
      sequence: account.sequence ? Numberify(account.sequence) : 0,
      accountNumber: Numberify(account.accountNumber),
      pubkey: pubKey,
    };

    let sig = '';
    if (!simulate) {
      const message = txn.jsonToSign;
      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await bitcoinProvider.signMessage(address, encodedMessage);
      
      const base64Sig = bytesToBase64(signedMessage.signature);
      //to hex
      const hexSig = Buffer.from(base64Sig, 'base64').toString('hex');
      sig = hexSig;
    }


    let txnExtension = signatureToWeb3ExtensionBitcoin(chain, sender, sig);

    // Create the txRaw
    let rawTx = createTxRawEIP712(
      txn.legacyAmino.body,
      txn.legacyAmino.authInfo,
      txnExtension,
    )

    return rawTx;
  }

  const getPublicKey = async (_cosmosAddress: string) => {
    return pubKey;
  }

  const bitcoinContext: BitcoinContextType = {
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
    cosmosAddress,
    setCosmosAddress: () => { },
    address,
    setAddress: () => { },
    setBitcoinProvider,
    bitcoinProvider,
    getPublicKey,
    loggedIn,
    setLoggedIn,
    lastSeenActivity,
    setLastSeenActivity,
  };


  return <BitcoinContext.Provider value={bitcoinContext}>
    {children}
  </ BitcoinContext.Provider>
}

export const useBitcoinContext = () => useContext(BitcoinContext)  