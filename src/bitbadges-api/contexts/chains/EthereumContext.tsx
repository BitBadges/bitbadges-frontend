import { createTxRawEIP712, signatureToWeb3Extension } from 'bitbadgesjs-proto';
import { PresetResource } from 'blockin';
import { ethers } from 'ethers';
import { Dispatch, SetStateAction, createContext, useContext, useEffect, useRef, useState } from 'react';
import Web3Modal from "web3modal";
// import { EIP712_BITBADGES_DOMAIN } from '../../api/eip712Types';
import { Secp256k1 } from '@cosmjs/crypto';
import { disconnect as disconnectWeb3, signMessage, signTypedData } from "@wagmi/core";
import { useWeb3Modal } from "@web3modal/react";
import { Numberify, convertToCosmosAddress } from 'bitbadgesjs-utils';
import { useCookies } from 'react-cookie';
import { useAccount } from "wagmi";
import { CHAIN_DETAILS } from '../../../constants';
import { useAccountsContext } from '../AccountsContext';
import { ChainSpecificContextType } from '../ChainContext';


export type EthereumContextType = ChainSpecificContextType & {
  web3Modal?: Web3Modal,
  setWeb3Modal: Dispatch<SetStateAction<Web3Modal | undefined>>;
  signer?: ethers.providers.JsonRpcSigner;
  setSigner: Dispatch<SetStateAction<ethers.providers.JsonRpcSigner | undefined>>;
}

export const EthereumContext = createContext<EthereumContextType>({
  address: '',
  setAddress: () => { },
  cosmosAddress: '',
  setCosmosAddress: () => { },
  web3Modal: undefined,
  setWeb3Modal: () => { },
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
})

type Props = {
  children?: React.ReactNode
};

export const EthereumContextProvider: React.FC<Props> = ({ children }) => {
  const accountsContext = useAccountsContext();
  const accountsContextRef = useRef(accountsContext);

  const [web3Modal, setWeb3Modal] = useState<Web3Modal>();
  const [address, setAddress] = useState<string>('')
  const [connected, setConnected] = useState<boolean>(false);
  const [chainId, setChainId] = useState<string>('Mainnet');
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();
  const [cosmosAddress, setCosmosAddress] = useState<string>('');
  const [cookies, setCookies] = useCookies(['blockincookie', 'pub_key']);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const { open } = useWeb3Modal();
  const web3AccountContext = useAccount();



  useEffect(() => {
    if (web3AccountContext.address) {
      setAddress(web3AccountContext.address);
      setCosmosAddress(convertToCosmosAddress(web3AccountContext.address));
      accountsContextRef.current.fetchAccountsWithOptions([{
        address: web3AccountContext.address,
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
        }]
      }]);
      setLoggedIn(cookies.blockincookie === convertToCosmosAddress(web3AccountContext.address));
      setConnected(true);
    } else {
      setConnected(false);
    }
  }, [web3AccountContext.address, cookies.blockincookie])


  const selectedChainInfo = {};
  const displayedResources: PresetResource[] = []; //This can be dynamic based on Chain ID if you want to give different token addresses for different Chain IDs

  //If you would like to support this, you can call this with a useEffect every time connected or address is updated
  const ownedAssetIds: string[] = [];

  const connect = async () => {
    if (!web3AccountContext.address) {
      await open();
    } else if (web3AccountContext.address) {
      setLoggedIn(cookies.blockincookie === convertToCosmosAddress(web3AccountContext.address));
      await accountsContext.fetchAccountsWithOptions([{
        address: web3AccountContext.address,
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
        }]
      }]);
    }
  }

  const disconnect = async () => {
    setAddress('');
    setCosmosAddress('');
    setConnected(false);
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
    accountsContext.setPublicKey(address, base64PubKey);
    setCookies('pub_key', `${address}-${base64PubKey}`, { path: '/' });

    return { originalBytes: new Uint8Array(Buffer.from(msg, 'utf8')), signatureBytes: new Uint8Array(Buffer.from(sign, 'utf8')), message: 'Success' }
  }

  const signTxn = async (txn: any, simulate: boolean) => {
    const accounts = await accountsContext.fetchAccounts([address]);
    const account = accounts[0];

    const chain = CHAIN_DETAILS;
    const sender = {
      accountAddress: cosmosAddress,
      sequence: account.sequence ? Numberify(account.sequence) : 0,
      accountNumber: Numberify(account.accountNumber),
      pubkey: account.publicKey,
    };
    let sig = '';
    if (!simulate) {
      sig = await signTypedData({
        value: txn.eipToSign.message,
        types: txn.eipToSign.types,
        domain: txn.eipToSign.domain
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
      if (currAccount && currAccount.publicKey) {
        return currAccount.publicKey
      }

      const message = "Hello! We noticed that you haven't used the BitBadges blockchain yet. To interact with the BitBadges blockchain, we need your public key for your address to allow us to generate transactions.\n\nPlease kindly sign this message to allow us to compute your public key.\n\nNote that this message is not a blockchain transaction and signing this message has no purpose other than to compute your public key.\n\nThanks for your understanding!"

      const sig = await signMessage({
        message: message
      });

      const msgHash = ethers.utils.hashMessage(message);
      const msgHashBytes = ethers.utils.arrayify(msgHash);
      const pubKey = ethers.utils.recoverPublicKey(msgHashBytes, sig);


      const pubKeyHex = pubKey.substring(2);
      const compressedPublicKey = Secp256k1.compressPubkey(new Uint8Array(Buffer.from(pubKeyHex, 'hex')));
      const base64PubKey = Buffer.from(compressedPublicKey).toString('base64');
      accountsContext.setPublicKey(address, base64PubKey);
      setCookies('pub_key', `${address}-${base64PubKey}`, { path: '/' });

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
    setCosmosAddress,
    address,
    setAddress,

    web3Modal,
    setWeb3Modal,
    signer,
    setSigner,
    getPublicKey,
    loggedIn,
    setLoggedIn
  };


  return <EthereumContext.Provider value={ethereumContext}>
    {children}
  </ EthereumContext.Provider>
}

export const useEthereumContext = () => useContext(EthereumContext)  