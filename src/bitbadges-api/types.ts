//TODO: sync with bitbadges-js and the main libraries
import { UriObject } from "bitbadgesjs-transactions/dist/messages/bitbadges/badges/typeUtils";
import { Permissions } from "./permissions";

export enum SupportedChain {
    ETH = 'Ethereum',
    COSMOS = 'Cosmos',
}


export enum TransactionStatus {
    None = 0,
    AwaitingSignatureOrBroadcast = 1,
}
export interface GetBadgeResponse {
    error?: any;
    badge?: BitBadgeCollection;
}

export interface BitBadgeCollection {
    permissions: Permissions;
    standard: number,
    defaultSubassetSupply: number,
    subassetSupplys: BalanceObject[],
    nextSubassetId: number,
    freezeRanges: IdRange[],
    manager: BitBadgesUserInfo,
    arbitraryBytes: string,
    uri: UriObject,
    id: number,
    collectionMetadata: BadgeMetadata,
    badgeMetadata: BadgeMetadata[],
}


export interface BalanceObject {
    balance: number,
    idRanges: IdRange[]
}

export interface BitBadgeMintObject {
    standard?: number;
    permissions?: number;
    metadata?: BadgeMetadata;
    subassetSupplys?: SubassetSupply[];
}

export interface GetBalanceResponse {
    error?: any;
    balanceInfo?: UserBalance;
}

export interface IdRange {
    start: number;
    end: number;
}

export interface UserBalance {
    balanceAmounts: {
        balance: number;
        idRanges: IdRange[]
    }[];
    pendingNonce: number;
    pending: PendingTransfer[];
    approvals: Approval[];
}

export interface Approval {
    address: number;
    approvalAmounts: {
        balance: number;
        idRanges: IdRange[]
    }[];
}

export interface PendingTransfer {
    subbadgeRange: IdRange;
    thisPendingNonce: number;
    otherPendingNonce: number;
    amount: number;
    sent: boolean;
    to: number;
    from: number;
    approvedBy: number;
    markedAsAccepted: boolean;
    expirationTime: number;
    cantCancelBeforeTime: number;
}


export interface BadgeMetadata {
    name: string;
    description: string;
    image: string;
    creator?: string;
    validFrom?: IdRange;
    color?: string;
    type?: number;
    category?: string;
    externalUrl?: string;
    tags?: string[];
}

export interface SubassetSupply {
    supply: number;
    amount: number;
}

export interface CosmosAccountInformation {
    account_number: number;
    sequence: number;
    pub_key: {
        key: string;
    }
    address: string;
}

export interface BitBadgesUserInfo {
    cosmosAddress: string,
    accountNumber: number,
    chain: string,
    address: string,
}
