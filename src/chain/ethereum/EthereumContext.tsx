import WalletConnectProvider from '@walletconnect/web3-provider';
import { cosmosToEth, ethToCosmos } from 'bitbadgesjs-address-converter';
import { createTxRawEIP712, signatureToWeb3Extension } from 'bitbadgesjs-transactions';
import { PresetResource } from 'blockin';
import { ethers, TypedDataField } from 'ethers';
import { createContext, Dispatch, SetStateAction, useContext, useState } from 'react';
import Web3Modal from "web3modal";
import { getAccountInformation } from '../../bitbadges-api/api';
import { CHAIN_DETAILS } from '../../constants';
// import { EIP712_BITBADGES_DOMAIN } from '../../api/eip712Types';
import { ChainSpecificContextType } from '../ChainContext';
import elliptic from "elliptic";
import { Secp256k1 } from '@cosmjs/crypto'
import { getSenderInformation } from '../../bitbadges-api/broadcast';
const secp256k1 = new elliptic.ec("secp256k1");

export type EthereumContextType = ChainSpecificContextType & {
    web3Modal?: Web3Modal,
    setWeb3Modal: Dispatch<SetStateAction<Web3Modal | undefined>>;
    signer?: ethers.providers.JsonRpcSigner;
    setSigner: Dispatch<SetStateAction<ethers.providers.JsonRpcSigner | undefined>>;
}

export const EthereumContext = createContext<EthereumContextType>({
    web3Modal: undefined,
    setWeb3Modal: () => { },
    connect: async () => { },
    disconnect: async () => { },
    chainId: 'Mainnet',
    setChainId: () => { },
    address: '',
    setAddress: () => { },
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
    cosmosAddress: '',
    setCosmosAddress: () => { },
    sequence: -1,
    incrementSequence: () => { },
    setSequence: () => { },
    publicKey: '',
    setPublicKey: () => { },
    accountNumber: -1,
    setAccountNumber: () => { },
    isRegistered: false,
    setIsRegistered: () => { },
})


type Props = {
    children?: React.ReactNode
};

export const EthereumContextProvider: React.FC<Props> = ({ children }) => {
    const [web3Modal, setWeb3Modal] = useState<Web3Modal>();
    const [address, setAddress] = useState<string>('')
    const [connected, setConnected] = useState<boolean>(false);
    const [chainId, setChainId] = useState<string>('Mainnet');
    const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();
    const [cosmosAddress, setCosmosAddress] = useState<string>('');
    const [sequence, setSequence] = useState<number>(-1);
    const [publicKey, setPublicKey] = useState<string>('');
    const [accountNumber, setAccountNumber] = useState<number>(-1);
    const [isRegistered, setIsRegistered] = useState<boolean>(false);

    const resolveAddressToENS = async (address: string) => {
        if (address) {
            const ensAddress = await ethers.getDefaultProvider('homestead', { quorum: 1 }).lookupAddress(address);
            if (ensAddress) return ensAddress;
        }
        return undefined;
    }
    const selectedChainInfo = { getNameForAddress: resolveAddressToENS };
    const displayedResources: PresetResource[] = []; //This can be dynamic based on Chain ID if you want to give different token addresses for different Chain IDs

    //If you would like to support this, you can call this with a useEffect every time connected or address is updated
    const ownedAssetIds: string[] = [];

    const connect = async () => {
        const providerOptions = {
            // Example with WalletConnect provider
            walletconnect: {
                package: WalletConnectProvider,
                options: {
                    infuraId: "27e484dcd9e3efcfd25a83a78777cdf1"
                }
            }
        };

        //TODO: Update dynamically based on provider
        const web3ModalInstance = web3Modal ? web3Modal : new Web3Modal({
            network: "mainnet", // optional
            cacheProvider: false, // optional
            providerOptions // required
        });
        setWeb3Modal(web3ModalInstance);
        web3ModalInstance.clearCachedProvider();

        const instance = await web3ModalInstance.connect();
        const provider = new ethers.providers.Web3Provider(instance);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        console.log("SIGNER", signer, address);

        const accountInformation = await getAccountInformation(ethToCosmos(address));
        setCosmosAddress(accountInformation.address);
        setSequence(accountInformation.sequence);
        setPublicKey(accountInformation.pub_key?.key);
        setAccountNumber(accountInformation.account_number);
        setIsRegistered(!!accountInformation.account_number);

        setSigner(signer);
        setConnected(true);
        setAddress(await signer.getAddress());
    }

    const incrementSequence = () => {
        setSequence(sequence + 1);
    }

    const disconnect = async () => {
        setAddress('');
        setConnected(false);
    };

    const signChallenge = async (message: string) => {
        let accounts = await window.ethereum.request({ method: 'eth_accounts' })

        const from = accounts[0];
        const msg = `0x${Buffer.from(message, 'utf8').toString('hex')}`;
        const sign = await window.ethereum.request({
            method: 'personal_sign',
            params: [msg, from],
        });

        return { originalBytes: new Uint8Array(Buffer.from(msg, 'utf8')), signatureBytes: new Uint8Array(Buffer.from(sign, 'utf8')), message: 'Success' }
    }

    const signTxn = async (txn: any) => {
        const chain = CHAIN_DETAILS;
        const sender = {
            accountAddress: cosmosAddress,
            sequence: sequence,
            accountNumber: accountNumber,
            pubkey: publicKey
        };
        console.log(txn.eipToSign);

        let sig = await window.ethereum.request({

            method: 'eth_signTypedData_v4',
            params: [cosmosToEth(sender.accountAddress), JSON.stringify(txn.eipToSign)],
        })

        let txnExtension = signatureToWeb3Extension(chain, sender, sig)

        // Create the txRaw
        let rawTx = createTxRawEIP712(
            txn.legacyAmino.body,
            txn.legacyAmino.authInfo,
            txnExtension,
        )

        return rawTx;
    }

    const getPublicKey = async (cosmosAddress: string) => {
        const message = 'Please sign this message, so we can generate your public key';

        let sig = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, cosmosToEth(cosmosAddress)],
        })

        const msgHash = ethers.utils.hashMessage(message);
        const msgHashBytes = ethers.utils.arrayify(msgHash);
        const pubKey = ethers.utils.recoverPublicKey(msgHashBytes, sig);


        const pubKeyHex = pubKey.substring(2);
        const compressedPublicKey = Secp256k1.compressPubkey(new Uint8Array(Buffer.from(pubKeyHex, 'hex')));
        const base64PubKey = Buffer.from(compressedPublicKey).toString('base64')
        return base64PubKey;
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
        address,
        setAddress,
        web3Modal,
        setWeb3Modal,
        signer,
        setSigner,
        getPublicKey,
        cosmosAddress,
        setCosmosAddress,
        sequence,
        setSequence,
        publicKey,
        setPublicKey,
        accountNumber,
        setAccountNumber,
        isRegistered,
        setIsRegistered,
        incrementSequence
    };

    return <EthereumContext.Provider value={ethereumContext}>
        {children}
    </ EthereumContext.Provider>
}

export const useEthereumContext = () => useContext(EthereumContext)  