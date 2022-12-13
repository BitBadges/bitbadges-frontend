//TODO: sync with bitbadges-js
import { UriObject } from "bitbadgesjs-transactions/dist/messages/bitbadges/badges/typeUtils";
import { Permissions } from "./permissions";

export interface GetBadgeResponse {
    error?: any;
    badge?: BitBadgeCollection;
}

export interface BitBadgeCollection {
    permissions: Permissions;
    metadata: BadgeMetadata,
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
    start?: number;
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