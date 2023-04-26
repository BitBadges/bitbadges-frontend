import { cosmosToEth, ethToCosmos } from 'bitbadgesjs-address-converter';
import { createTxRawEIP712, signatureToWeb3Extension } from 'bitbadgesjs-transactions';
import { AnnouncementActivityItem, TransferActivityItem } from 'bitbadgesjs-utils';
import { PresetResource } from 'blockin';
import { ethers } from 'ethers';
import { Dispatch, SetStateAction, createContext, useContext, useEffect, useState } from 'react';
import Web3Modal from "web3modal";
import { getAccountActivity, getAccountInformation } from '../../bitbadges-api/api';
// import { EIP712_BITBADGES_DOMAIN } from '../../api/eip712Types';
import { Secp256k1 } from '@cosmjs/crypto';
import { disconnect as disconnectWeb3, signMessage } from "@wagmi/core";
import { useWeb3Modal } from "@web3modal/react";
import { useCookies } from 'react-cookie';
import { useAccount } from "wagmi";
import { CHAIN_DETAILS } from '../../constants';
import { ChainSpecificContextType } from '../ChainContext';


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
    name: '',
    setName: () => { },
    avatar: '',
    setAvatar: () => { },
    github: '',
    setGithub: () => { },
    discord: '',
    setDiscord: () => { },
    telegram: '',
    setTelegram: () => { },
    twitter: '',
    setTwitter: () => { },
    activity: [],
    setActivity: () => { },
    announcements: [],
    setAnnouncements: () => { },
    seenActivity: 0,
    setSeenActivity: () => { },
    loggedIn: false,
    setLoggedIn: () => { },
    announcementsBookmark: '',
    setAnnouncementsBookmark: () => { },
    activityBookmark: '',
    setActivityBookmark: () => { },
    announcementsHasMore: false,
    setAnnouncementsHasMore: () => { },
    activityHasMore: false,
    setActivityHasMore: () => { },
    balance: 0,
    setBalance: () => { },
    updatePortfolioInfo: async (_address: string) => { },
    airdropped: false,
    setAirdropped: () => { }
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
    const [name, setName] = useState<string>('');
    const [avatar, setAvatar] = useState<string>('');
    const [twitter, setTwitter] = useState<string>('');
    const [discord, setDiscord] = useState<string>('');
    const [github, setGithub] = useState<string>('');
    const [telegram, setTelegram] = useState<string>('');
    const [activity, setActivity] = useState<TransferActivityItem[]>([]);
    const [announcements, setAnnouncements] = useState<AnnouncementActivityItem[]>([]);
    const [seenActivity, setSeenActivity] = useState(0);
    const [cookies] = useCookies(['blockincookie']);
    const [loggedIn, setLoggedIn] = useState<boolean>(false);
    const [announcementsBookmark, setAnnouncementsBookmark] = useState<string>('');
    const [activityBookmark, setActivityBookmark] = useState<string>('');
    const [announcementsHasMore, setAnnouncementsHasMore] = useState<boolean>(true);
    const [activityHasMore, setActivityHasMore] = useState<boolean>(true);
    const [balance, setBalance] = useState<number>(0);
    const [airdropped, setAirdropped] = useState<boolean>(false);
    const { open } = useWeb3Modal();
    const web3AccountContext = useAccount();
    // const { disconnectAsync } = useDisconnect();


    // useEffect(() => {
    //     setConnected(web3AccountContext.isConnected);
    // }, [web3AccountContext.isConnected])

    useEffect(() => {
        if (web3AccountContext.address) {
            setAddress(web3AccountContext.address);
            updatePortfolioInfo(web3AccountContext.address);
            setConnected(true);
        } else {
            setConnected(false);
        }
    }, [web3AccountContext.address])


    const selectedChainInfo = {};
    const displayedResources: PresetResource[] = []; //This can be dynamic based on Chain ID if you want to give different token addresses for different Chain IDs

    //If you would like to support this, you can call this with a useEffect every time connected or address is updated
    const ownedAssetIds: string[] = [];

    const updatePortfolioInfo = async (signerAddress: string) => {
        const accountInformation = await getAccountInformation(ethToCosmos(signerAddress));
        setCosmosAddress(accountInformation.cosmosAddress);
        setSequence(Number(accountInformation.sequence));
        setPublicKey(accountInformation.pub_key);
        setAccountNumber(Number(accountInformation.account_number));
        setIsRegistered(Number(accountInformation.account_number) >= 0);
        setName(accountInformation.name || '');
        setAvatar(accountInformation.avatar || '');
        setTelegram(accountInformation.telegram || '');
        setDiscord(accountInformation.discord || '');
        setGithub(accountInformation.github || '');
        setTwitter(accountInformation.twitter || '');
        setSeenActivity(accountInformation.seenActivity ? accountInformation.seenActivity : 0);
        setBalance(accountInformation.balance?.amount ? Number(accountInformation.balance.amount) : 0);
        setAirdropped(accountInformation.airdropped || false);

        setLoggedIn(cookies.blockincookie === accountInformation.cosmosAddress);

        if (Number(accountInformation.account_number) >= 0) {
            const activityRes = await getAccountActivity(Number(accountInformation.account_number));
            setActivity(activityRes.activity);
            setAnnouncements(activityRes.announcements)

            setActivityBookmark(activityRes.pagination.activity.bookmark);
            setAnnouncementsBookmark(activityRes.pagination.announcements.bookmark);

            setActivityHasMore(activityRes.pagination.activity.hasMore);
            setAnnouncementsHasMore(activityRes.pagination.announcements.hasMore);
        }
    }

    const connect = async () => {
        if (!web3AccountContext.address) {
            await open();
        } else if (web3AccountContext.address) {
            await updatePortfolioInfo(web3AccountContext.address);
        }
    }

    const incrementSequence = () => {
        setSequence(Number(sequence) + 1);
    }

    const disconnect = async () => {
        setAddress('');
        setConnected(false);
        await disconnectWeb3();
    };

    const signChallenge = async (message: string) => {
        const msg = `0x${Buffer.from(message, 'utf8').toString('hex')}`;
        const sign = await signMessage({
            message: message
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

        // txn.eipToSign.domain.verifyingContract = '0x1A16c87927570239FECD343ad2654fD81682725e'
        // txn.eipToSign.domain.salt = '0x6c00000000000000000000000000000000000000000000000000000000000000'

        // console.log(txn.eipToSign);
        let sigOrig = await window.ethereum.request({
            method: 'eth_signTypedData_v4',
            params: [cosmosToEth(sender.accountAddress), JSON.stringify(txn.eipToSign)],
        })

        console.log(sigOrig);

        // let sig = await signTypedData(txn.eipToSign);
        // console.log(sig)
        let sig = sigOrig


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
            const message = "Hello there! We noticed that you haven't used the BitBadges blockchain yet. To interact with the BitBadges blockchain, we need your public key for your address to allow us to generate transactions.\n\nPlease kindly sign this message to allow us to compute your public key.\n\nNote that this message is not a blockchain transaction and signing this message has no purpose other than to compute your public key.\n\nThanks for your understanding!"

            const sig = await signMessage({
                message: message
            });

            const msgHash = ethers.utils.hashMessage(message);
            const msgHashBytes = ethers.utils.arrayify(msgHash);
            const pubKey = ethers.utils.recoverPublicKey(msgHashBytes, sig);


            const pubKeyHex = pubKey.substring(2);
            const compressedPublicKey = Secp256k1.compressPubkey(new Uint8Array(Buffer.from(pubKeyHex, 'hex')));
            const base64PubKey = Buffer.from(compressedPublicKey).toString('base64');
            setPublicKey(base64PubKey);
            return base64PubKey;
        } catch (e) {
            console.log(e);
            return '';
        }
    }

    const ethereumContext: EthereumContextType = {
        balance,
        setBalance,
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
        incrementSequence,
        name,
        setName,
        avatar,
        setAvatar,
        telegram,
        setTelegram,
        discord,
        setDiscord,
        github,
        setGithub,
        twitter,
        setTwitter,
        activity,
        setActivity,
        announcements,
        setAnnouncements,
        seenActivity,
        setSeenActivity,
        loggedIn,
        setLoggedIn,
        announcementsBookmark,
        setAnnouncementsBookmark,
        activityBookmark,
        setActivityBookmark,
        announcementsHasMore,
        setAnnouncementsHasMore,
        activityHasMore,
        setActivityHasMore,
        updatePortfolioInfo,
        airdropped,
        setAirdropped
    };


    return <EthereumContext.Provider value={ethereumContext}>
        {children}
    </ EthereumContext.Provider>
}

export const useEthereumContext = () => useContext(EthereumContext)  