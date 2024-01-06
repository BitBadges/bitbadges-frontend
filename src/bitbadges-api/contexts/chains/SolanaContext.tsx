
import { notification } from 'antd';
import { SupportedChain, createTxRawEIP712, signatureToWeb3ExtensionSolana } from 'bitbadgesjs-proto';
import { Numberify, convertToCosmosAddress, solanaToCosmos } from 'bitbadgesjs-utils';
import { Dispatch, SetStateAction, createContext, useCallback, useContext, useState } from 'react';
import { useCookies } from 'react-cookie';
import { CHAIN_DETAILS, SOLANA_LOGO } from '../../../constants';
import { checkIfSignedIn } from '../../api';
import { ChainSpecificContextType } from '../ChainContext';
import { useAccount } from '../accounts/AccountsContext';
import { fetchDefaultViews } from './helpers';

const bs58 = require('bs58');


export type SolanaContextType = ChainSpecificContextType & {
  solanaProvider: any;
  setSolanaProvider: Dispatch<SetStateAction<any | undefined>>;
}

export const SolanaContext = createContext<SolanaContextType>({
  address: '',
  connect: async () => { },
  disconnect: async () => { },
  signChallenge: async () => { return { message: '', signature: '' } },
  getPublicKey: async () => { return '' },
  signTxn: async () => { },
  selectedChainInfo: {},
  connected: false,
  setConnected: () => { },
  solanaProvider: undefined,
  setSolanaProvider: () => { },
  loggedIn: false,
  setLoggedIn: () => { },
  lastSeenActivity: 0,
  setLastSeenActivity: () => { },
})

type Props = {
  children?: React.ReactNode
};

export const SolanaContextProvider: React.FC<Props> = ({ children }) => {
  const [cookies, setCookies] = useCookies(['blockincookie', 'pub_key']);

  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [lastSeenActivity, setLastSeenActivity] = useState<number>(0);
  const [solanaProvider, setSolanaProvider] = useState<any>();
  const [pubKey, setPubKey] = useState<string>('');

  const [address, setAddress] = useState<string>('');
  const cosmosAddress = convertToCosmosAddress(address);
  const connected = address ? true : false;
  const setConnected = () => { }
  const account = useAccount(cosmosAddress)

  const getProvider = () => {
    if ('phantom' in window) {
      const phantomWindow = window as any;
      const provider = phantomWindow.phantom?.solana;
      setSolanaProvider(provider);
      if (provider?.isPhantom) {
        return provider;
      }

      window.open('https://phantom.app/', '_blank');
    }
  };

  const selectedChainInfo = {
    name: 'Solana',
    logo: SOLANA_LOGO,
    abbreviation: 'SOL',
    getAddressExplorerUrl: (address: string) => `https://explorer.solana.com/address/${address}`,
  }
  
  const connect = async () => {
    await connectAndPopulate(address ?? '', cookies.blockincookie);
  }

  const connectAndPopulate = useCallback(async (address: string, cookie: string) => {
    if (!address) {
      try {
        const provider = getProvider(); // see "Detecting the Provider"

        const resp = await provider.request({ method: "connect" });
        const address = resp.publicKey.toBase58();
        const pubKey = resp.publicKey.toBase58();
        const cosmosAddress = solanaToCosmos(address);

        setSolanaProvider(provider);
        setAddress(address);

        const solanaPublicKeyBase58 = pubKey;
        const solanaPublicKeyBuffer = bs58.decode(solanaPublicKeyBase58);
        const publicKeyToSet = Buffer.from(solanaPublicKeyBuffer).toString('base64')
        setPubKey(publicKeyToSet);
        setCookies('pub_key', `${cosmosAddress}-${publicKeyToSet}`, { path: '/' });

        let loggedIn = false;
        if (cookie === convertToCosmosAddress(address)) {
          const signedInRes = await checkIfSignedIn({});
          setLoggedIn(signedInRes.signedIn);
          loggedIn = signedInRes.signedIn;
        } else {
          setLoggedIn(false);
        }

        if (loggedIn) {
          setLastSeenActivity(Date.now());
        }

        await fetchDefaultViews(address, loggedIn);
      } catch (e) {
        console.error(e);
        notification.error({
          message: 'Error connecting to wallet',
          description: 'Make sure you have Phantom installed and are logged in.',
        })
      }
    }
  }, [setCookies]);


  const disconnect = async () => {
    setLoggedIn(false);
    setAddress('');
    await solanaProvider?.request({ method: "disconnect" });
  };

  const signChallenge = async (message: string) => {
    const encodedMessage = new TextEncoder().encode(message);
    const provider = solanaProvider;
    const signedMessage = await provider.request({
      method: "signMessage",
      params: {
        message: encodedMessage,
        display: "utf8",
      },
    });
    
    return { message: message, signature: signedMessage.signature };
  }

  const signTxn = async (txn: any, simulate: boolean) => {
    if (!account) throw new Error('Account not found.');

    const chain = { ...CHAIN_DETAILS, chain: SupportedChain.SOLANA };
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
      const signedMessage = await solanaProvider.request({
        method: "signMessage",
        params: {
          message: encodedMessage,
          display: "utf8",
        },
      });
      sig = signedMessage.signature.toString('hex');
    }


    let txnExtension = signatureToWeb3ExtensionSolana(chain, sender, sig, address);

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

  const solanaContext: SolanaContextType = {
    connected,
    setConnected,
    connect,
    disconnect,
    selectedChainInfo,
    signChallenge,
    signTxn,
    address,
    setSolanaProvider,
    solanaProvider,
    getPublicKey,
    loggedIn,
    setLoggedIn,
    lastSeenActivity,
    setLastSeenActivity,
  };


  return <SolanaContext.Provider value={solanaContext}>
    {children}
  </SolanaContext.Provider>
}

export const useSolanaContext = () => useContext(SolanaContext)  