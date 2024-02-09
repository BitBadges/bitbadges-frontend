import { notification } from 'antd';
import {
  BigIntify,
  TransactionPayload,
  TxContext,
  convertToCosmosAddress,
  createTxBroadcastBodyBitcoin
} from 'bitbadgesjs-sdk';
import { constructChallengeObjectFromString } from 'blockin';
import {
  Dispatch,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { useCookies } from 'react-cookie';
import { BITCOIN_LOGO } from '../../../constants';
import { checkIfSignedIn } from '../../api';
import { ChainSpecificContextType } from '../ChainContext';
import { useAccount } from '../accounts/AccountsContext';
import { fetchDefaultViews } from './helpers';

export type BitcoinContextType = ChainSpecificContextType & {
  bitcoinProvider: any;
  setBitcoinProvider: Dispatch<SetStateAction<any | undefined>>;
};

export const BitcoinContext = createContext<BitcoinContextType>({
  address: '',
  connect: async () => { },
  disconnect: async () => { },
  signChallenge: async () => {
    return { message: '', signature: '' };
  },
  getPublicKey: async () => {
    return '';
  },
  loggedInExpiration: 0,
  signTxn: async () => { return '' },
  selectedChainInfo: {},
  connected: false,
  setConnected: () => { },
  bitcoinProvider: undefined,
  setBitcoinProvider: () => { },
  loggedIn: false,
  setLoggedIn: () => { },
  lastSeenActivity: 0,
  setLastSeenActivity: () => { },
});

type Props = {
  children?: React.ReactNode;
};

export const BitcoinContextProvider: React.FC<Props> = ({ children }) => {
  const [cookies, setCookies] = useCookies(['blockincookie', 'pub_key']);

  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [loggedInExpiration, setLoggedInExpiration] = useState<number>(0);
  const [lastSeenActivity, setLastSeenActivity] = useState<number>(0);
  const [bitcoinProvider, setBitcoinProvider] = useState<any>();
  const [pubKey, setPubKey] = useState<string>('');

  const [address, setAddress] = useState<string>('');
  const cosmosAddress = convertToCosmosAddress(address);
  const connected = address ? true : false;
  const setConnected = () => { };
  const account = useAccount(cosmosAddress);

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
    getAddressExplorerUrl: (address: string) =>
      `https://www.blockchain.com/btc/address/${address}`,
  };

  const connect = async () => {
    await connectAndPopulate(address ?? '', cookies.blockincookie);
  };

  const connectAndPopulate = useCallback(
    async (address: string, cookie: string) => {
      if (!address) {
        try {
          const provider = getProvider(); // see "Detecting the Provider"

          const accounts = await provider.requestAccounts();
          if (accounts.length === 0) {
            throw new Error('No account found');
          }

          const address = accounts[0].address;
          if (accounts[0].addressType !== 'p2wpkh') {
            throw new Error('Invalid account type');
          }

          const cosmosAddress = convertToCosmosAddress(address);
          const publicKey = accounts[0].publicKey; //Hex public key
          const base64PublicKey = Buffer.from(
            publicKey,
            'hex'
          ).toString('base64');

          setBitcoinProvider(provider);
          setAddress(address);
          setPubKey(base64PublicKey);
          setCookies(
            'pub_key',
            `${cosmosAddress}-${base64PublicKey}`,
            { path: '/' }
          );

          let loggedIn = false;
          if (cookie === convertToCosmosAddress(address)) {
            const signedInRes = await checkIfSignedIn({});
            setLoggedIn(signedInRes.signedIn);
            loggedIn = signedInRes.signedIn;
            if (signedInRes.message) {
              const params = constructChallengeObjectFromString(signedInRes.message, BigIntify)
              setLoggedInExpiration(params.expirationDate ? new Date(params.expirationDate).getTime() : 0);
            }
          } else {
            setLoggedIn(false);
          }

          if (loggedIn) {
            setLastSeenActivity(Date.now());
          }

          await fetchDefaultViews(address, loggedIn);
        } catch (e) {
          console.log(e);
          notification.error({
            message: 'Error connecting to wallet',
            description:
              'Make sure you have Phantom installed and are logged in.',
          });
        }
      }
    },
    [setCookies]
  );

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
  };

  const signTxn = async (context: TxContext, payload: TransactionPayload, simulate: boolean) => {
    if (!account) throw new Error('Account not found.');
    const bitcoinProvider = getProvider();

    let sig = '';
    if (!simulate) {
      const message = payload.jsonToSign;
      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await bitcoinProvider.signMessage(
        address,
        encodedMessage
      );

      const base64Sig = bytesToBase64(signedMessage.signature);
      sig = Buffer.from(base64Sig, 'base64').toString('hex');
    }

    const txBody = createTxBroadcastBodyBitcoin(context, payload, sig);
    return txBody;
  };
  const getPublicKey = async (_cosmosAddress: string) => {
    return pubKey;
  };

  const bitcoinContext: BitcoinContextType = {
    connected,
    setConnected,
    connect,
    disconnect,
    loggedInExpiration,
    selectedChainInfo,
    signChallenge,
    signTxn,
    address,
    setBitcoinProvider,
    bitcoinProvider,
    getPublicKey,
    loggedIn,
    setLoggedIn,
    lastSeenActivity,
    setLastSeenActivity,
  };

  return (
    <BitcoinContext.Provider value={bitcoinContext}>
      {children}
    </BitcoinContext.Provider>
  );
};

export const useBitcoinContext = () => useContext(BitcoinContext);
