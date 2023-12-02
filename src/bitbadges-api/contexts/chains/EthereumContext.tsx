import { Secp256k1 } from '@cosmjs/crypto';
import { disconnect as disconnectWeb3, signMessage, signTypedData } from "@wagmi/core";
import { useWeb3Modal } from '@web3modal/wagmi/react';

import { notification } from 'antd';
import { SupportedChain, createTxRawEIP712, signatureToWeb3Extension } from 'bitbadgesjs-proto';
import { AccountViewKey, Numberify, convertToCosmosAddress } from 'bitbadgesjs-utils';
import { PresetUri } from 'blockin';
import { ethers } from 'ethers';
import { Dispatch, SetStateAction, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { useAccount as useWeb3Account } from "wagmi";
import { CHAIN_DETAILS } from '../../../constants';
import { checkIfSignedIn } from '../../api';

import { ChainSpecificContextType } from '../ChainContext';
import { fetchAccountsWithOptions, setPublicKey, useAccount } from '../accounts/AccountsContext';


export type EthereumContextType = ChainSpecificContextType & {
  signer?: ethers.providers.JsonRpcSigner;
  setSigner: Dispatch<SetStateAction<ethers.providers.JsonRpcSigner | undefined>>;
}

export const EthereumContext = createContext<EthereumContextType>({
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
  signer: undefined,
  setSigner: () => { },
  loggedIn: false,
  setLoggedIn: () => { },
  lastSeenActivity: 0,
  setLastSeenActivity: () => { },
})

type Props = {
  children?: React.ReactNode
};

export const EthereumContextProvider: React.FC<Props> = ({ children }) => {


  const [chainId, setChainId] = useState<string>('Mainnet');
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();
  const [cookies, setCookies] = useCookies(['blockincookie', 'pub_key']);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [lastSeenActivity, setLastSeenActivity] = useState<number>(0);
  const { open } = useWeb3Modal();
  const web3AccountContext = useWeb3Account();
  const address = web3AccountContext.address || '';
  const cosmosAddress = convertToCosmosAddress(address);
  const connected = web3AccountContext.address ? true : false;
  const setConnected = () => { }
  const account = useAccount(cosmosAddress)

  const selectedChainInfo = {};
  const displayedResources: PresetUri[] = []; //This can be dynamic based on Chain ID if you want to give different token addresses for different Chain IDs

  //If you would like to support this, you can call this with a useEffect every time connected or address is updated
  const ownedAssetIds: string[] = [];

  const connect = async () => {
    await connectAndPopulate(web3AccountContext.address ?? '', cookies.blockincookie);
  }

  const connectAndPopulate = useCallback(async (address: string, cookie: string) => {
    const DefaultViewsToFetch: { viewKey: AccountViewKey; bookmark: string; }[] = [{
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
    }, {
      viewKey: 'explicitlyIncludedAddressMappings',
      bookmark: ''
    },
    {
      viewKey: 'explicitlyExcludedAddressMappings',
      bookmark: ''
    }]

    if (!address) {
      try {
        await open();

      } catch (e) {
        notification.error({
          message: 'Error connecting to wallet',
          description: 'Make sure you have a compatible Ethereum wallet installed (such as MetaMask) and that you are signed in to it.',
        })
      }
    } else if (address) {

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
          viewKey: 'latestClaimAlerts',
          bookmark: '',
        }, {
          viewKey: 'latestAddressMappings',
          bookmark: ''
        },
          {
            viewKey: 'authCodes',
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
    }
  }, [open]);

  useEffect(() => {
    if (web3AccountContext.address) {
      connectAndPopulate(web3AccountContext.address, cookies.blockincookie);
    }
  }, [web3AccountContext.address]);


  const disconnect = async () => {
    setLoggedIn(false);
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
      signature: sign,
    }
  }

  const signTxn = async (txn: any, simulate: boolean) => {
    if (!account) throw new Error('Account not found.');

    const chain = { ...CHAIN_DETAILS, chain: SupportedChain.ETH };
    const sender = {
      accountAddress: cosmosAddress,
      sequence: account.sequence ? Numberify(account.sequence) : 0,
      accountNumber: Numberify(account.accountNumber),
      pubkey: account.publicKey,
    };
    let sig = '';
    if (!simulate) {
      console.log(txn.eipToSign);

      sig = await signTypedData({
        message: txn.eipToSign.message,
        types: txn.eipToSign.types,
        domain: txn.eipToSign.domain,
        primaryType: txn.eipToSign.primaryType
      });
    }

    let txnExtension = signatureToWeb3Extension(chain, sender, sig)

    // Create the txRaw
    let rawTx = createTxRawEIP712(
      txn.legacyAmino.body,
      txn.legacyAmino.authInfo,
      txnExtension,
    )

    return rawTx;
  }

  const getPublicKey = async (_cosmosAddress: string) => {
    try {
      const currAccount = account;

      //If we have stored the public key in cookies, use that instead (for Ethereum)
      if (currAccount && cookies.pub_key && cookies.pub_key.split('-')[0] === currAccount.cosmosAddress) {
        return cookies.pub_key.split('-')[1];
      }

      if (currAccount && currAccount.publicKey) {
        return currAccount.publicKey
      }

      const message = "Hello! We noticed that you haven't interacted the BitBadges blockchain yet. To interact with the BitBadges blockchain, we need your PUBLIC key for your address to allow us to generate transactions.\n\nPlease kindly sign this message to allow us to compute your public key.\n\nNote that this message is not a blockchain transaction and signing this message has no purpose other than to compute your public key.\n\nThanks for your understanding!"

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
  }

  const ethereumContext: EthereumContextType = {
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
    signer,
    setSigner,
    getPublicKey,
    loggedIn,
    setLoggedIn,
    lastSeenActivity,
    setLastSeenActivity
  };


  return <EthereumContext.Provider value={ethereumContext}>
    {children}
  </ EthereumContext.Provider>
}

export const useEthereumContext = () => useContext(EthereumContext)  