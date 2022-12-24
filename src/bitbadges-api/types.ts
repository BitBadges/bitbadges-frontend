//TODO: sync with bitbadges-js
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
    metadata: BadgeMetadata,
    badgeMetadataMap: {
        [key: number]: BadgeMetadata
    }
    standard: number,
    defaultSubassetSupply: number,
    subassetSupplys: BalanceObject[],
    nextSubassetId: number,
    freezeRanges: any[],
    manager: any,
    arbitraryBytes: any,
    uri: UriObject,
    id: number
}

export interface BitBadge {
    metadata: BadgeMetadata,
    badgeId: number,
    totalSupply: number,
    uri: UriObject,
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
    end?: number;
}

export interface UserBalance {
    balanceAmounts: {
        balance: number;
        id_ranges: IdRange[]
    }[];
    pendingNonce: number;
    pending: any[];
    approvals: any[]; //TODO:
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
