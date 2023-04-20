import { AnnouncementActivityItem, CHAIN_DETAILS, TransferActivityItem, convertToCosmosAddress } from 'bitbadgesjs-utils';
import { PresetResource, SupportedChainMetadata } from 'blockin';
import { Dispatch, SetStateAction, createContext, useContext, useState } from 'react';
import { getAccountActivity, getAccountInformation } from '../../bitbadges-api/api';
import {
    SigningStargateClient
} from "@cosmjs/stargate";
import { AccountData, Window as KeplrWindow } from "@keplr-wallet/types";
import { verifyADR36Amino } from '@keplr-wallet/cosmos'
import { createTxRaw } from 'bitbadgesjs-proto';
import Long from 'long';
import { useCookies } from 'react-cookie';
import { COSMOS_LOGO, HOSTNAME } from '../../constants';
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
    connect: async () => { },
    disconnect: async () => { },
    chainId: 'bitbadges_1-1',
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
    airdropped: false,
    setAirdropped: () => { },

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
})


type Props = {
    children?: React.ReactNode
};

export const CosmosContextProvider: React.FC<Props> = ({ children }) => {
    const [address, setAddress] = useState<string>('')
    const [connected, setConnected] = useState<boolean>(false);
    const [chainId, setChainId] = useState<string>('bitbadges_1-1');
    const [signer, setSigner] = useState<SigningStargateClient>();
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

    const selectedChainInfo: SupportedChainMetadata = {
        name: 'Cosmos',
        logo: COSMOS_LOGO,
        abbreviation: 'COSM'
    };
    const displayedResources: PresetResource[] = []; //This can be dynamic based on Chain ID if you want to give different token addresses for different Chain IDs

    //If you would like to support this, you can call this with a useEffect every time connected or address is updated
    const ownedAssetIds: string[] = [];

    const updatePortfolioInfo = async (signerAddress: string) => {
        const accountInformation = await getAccountInformation(convertToCosmosAddress(signerAddress));
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
        const { keplr } = window
        if (!keplr || !window || !window.getOfflineSigner) {
            alert("You need to install Keplr")
            return
        }

        await keplr.experimentalSuggestChain(BitBadgesKeplrSuggestChainInfo)

        const offlineSigner = window.getOfflineSigner(chainId);

        console.log(offlineSigner);
        const signingClient = await SigningStargateClient.connectWithSigner(
            `http://${HOSTNAME}:26657`,
            offlineSigner,
        )

        const account: AccountData = (await offlineSigner.getAccounts())[0]

        await updatePortfolioInfo(account.address);

        setSigner(signingClient);
        setConnected(true);
        setAddress(account.address);
    }

    const incrementSequence = () => {
        setSequence(Number(sequence) + 1);
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

    const signTxn = async (txn: any) => {
        const chain = CHAIN_DETAILS;
        const sender = {
            accountAddress: cosmosAddress,
            sequence: sequence,
            accountNumber: accountNumber,
            pubkey: publicKey
        };

        await window.keplr?.enable(chainId);

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

        const { signed } = signResponse

        const signedTx = createTxRaw(
            signed.bodyBytes,
            signed.authInfoBytes,
            signatures,
        )

        return signedTx;
    }

    const getPublicKey = async (_cosmosAddress: string) => {
        const chain = CHAIN_DETAILS;

        const account = await window?.keplr?.getKey(chain.cosmosChainId)
        if (!account) return '';
        const pk = Buffer.from(account.pubKey).toString('base64')

        return pk;
    }

    const cosmosContext: CosmosContextType = {
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


    return <CosmosContext.Provider value={cosmosContext}>
        {children}
    </ CosmosContext.Provider>
}

export const useCosmosContext = () => useContext(CosmosContext)  