import { Secp256k1 } from '@cosmjs/crypto';
import { disconnect as disconnectWeb3, signMessage, signTypedData } from "@wagmi/core";
import { useWeb3Modal } from '@web3modal/wagmi/react';

import { notification } from 'antd';
import { SupportedChain, createTxRawEIP712, signatureToWeb3Extension } from 'bitbadgesjs-proto';
import { AccountViewKey, Numberify, convertToCosmosAddress } from 'bitbadgesjs-utils';
import { PresetUri } from 'blockin';
import { ethers } from 'ethers';
import { Dispatch, SetStateAction, createContext, useContext, useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { useAccount } from "wagmi";
import { CHAIN_DETAILS, INFINITE_LOOP_MODE } from '../../../constants';
import { checkIfSignedIn } from '../../api';
import { useAccountsContext } from '../accounts/AccountsContext';
import { ChainSpecificContextType } from '../ChainContext';


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
  signChallenge: async () => { return {} },
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
  const accountsContext = useAccountsContext();

  const [chainId, setChainId] = useState<string>('Mainnet');
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();
  const [cookies, setCookies] = useCookies(['blockincookie', 'pub_key']);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [lastSeenActivity, setLastSeenActivity] = useState<number>(0);
  const { open } = useWeb3Modal();
  const web3AccountContext = useAccount();
  const address = web3AccountContext.address || '';
  const cosmosAddress = convertToCosmosAddress(address);
  const connected = web3AccountContext.address ? true : false;
  const setConnected = () => { }

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

  const selectedChainInfo = {};
  const displayedResources: PresetUri[] = []; //This can be dynamic based on Chain ID if you want to give different token addresses for different Chain IDs

  //If you would like to support this, you can call this with a useEffect every time connected or address is updated
  const ownedAssetIds: string[] = [];

  useEffect(() => {
    if (web3AccountContext.address) {
      connect();

    }
  }, [web3AccountContext.address]);

  const connect = async () => {
    if (!web3AccountContext.address) {
      try {
        await open();

      } catch (e) {
        notification.error({
          message: 'Error connecting to wallet',
          description: 'Make sure you have a compatible Ethereum wallet installed (such as MetaMask) and that you are signed in to it.',
        })
      }
    } else if (web3AccountContext.address) {

      let loggedIn = false;
      if (cookies.blockincookie === convertToCosmosAddress(web3AccountContext.address)) {
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
        })
        setLastSeenActivity(Date.now());
      }


      const res = await accountsContext.fetchAccountsWithOptions([{
        address: web3AccountContext.address,
        fetchSequence: true,
        fetchBalance: true,
        viewsToFetch
      }]);

      console.log(res);
    }
  }

  const disconnect = async () => {
    setLoggedIn(false);
    await disconnectWeb3();
  };

  const signChallenge = async (message: string) => {
    const msg = `0x${Buffer.from(message, 'utf8').toString('hex')}`;
    const sign = await signMessage({
      message: message
    });

    const msgHash = ethers.utils.hashMessage(message);
    const msgHashBytes = ethers.utils.arrayify(msgHash);
    const pubKey = ethers.utils.recoverPublicKey(msgHashBytes, sign);

    const pubKeyHex = pubKey.substring(2);
    const compressedPublicKey = Secp256k1.compressPubkey(new Uint8Array(Buffer.from(pubKeyHex, 'hex')));
    const base64PubKey = Buffer.from(compressedPublicKey).toString('base64');
    accountsContext.setPublicKey(cosmosAddress, base64PubKey);
    setCookies('pub_key', `${cosmosAddress}-${base64PubKey}`, { path: '/' });

    return { originalBytes: new Uint8Array(Buffer.from(msg, 'utf8')), signatureBytes: new Uint8Array(Buffer.from(sign, 'utf8')), message: 'Success' }
  }

  const signTxn = async (txn: any, simulate: boolean) => {
    const accounts = await accountsContext.fetchAccountsWithOptions([{ address: address, fetchSequence: true, fetchBalance: true }]);
    const account = accounts[0];

    const chain = { ...CHAIN_DETAILS, chain: SupportedChain.ETH };
    const sender = {
      accountAddress: cosmosAddress,
      sequence: account.sequence ? Numberify(account.sequence) : 0,
      accountNumber: Numberify(account.accountNumber),
      pubkey: account.publicKey,
    };
    let sig = '';
    if (!simulate) {
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
      const currAccount = accountsContext.getAccount(_cosmosAddress);
      console.log("currAccount", currAccount);
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
      console.log("base64PubKey", base64PubKey);
      accountsContext.setPublicKey(_cosmosAddress, base64PubKey);
      setCookies('pub_key', `${_cosmosAddress}-${base64PubKey}`, { path: '/' });

      console.log(accountsContext.getAccount(_cosmosAddress));
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