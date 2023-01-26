//TODO: sync with bitbadges-js and the main libraries

import { Permissions } from "./permissions";

export enum SupportedChain {
    ETH = 'Ethereum',
    COSMOS = 'Cosmos',
}

export enum TransactionStatus {
    None = 0,
    AwaitingSignatureOrBroadcast = 1,
}
export interface GetCollectionResponse {
    error?: any;
    collection?: BitBadgeCollection;
}

export interface IdRange {
    start: number;
    end: number;
}
export interface BadgeSupplyAndAmount {
    amount: number;
    supply: number;
}
export interface Balance {
    balance: number;
    badgeIds: IdRange[];
}
export interface TransferMapping {
    to: Addresses;
    from: Addresses;
}
export interface Addresses {
    accountNums: IdRange[];
    options: number;
}
export interface Transfers {
    toAddresses: number[];
    balances: Balance[];
}
export interface Claims {
    balance: Balance;
    amountPerClaim: number;
    type: number;
    data: string;
    uri: string;
    timeRange: IdRange;
}
export interface Proof {
    total: number;
    index: number;
    leafHash: string;
    proof: string[];
}
//# sourceMappingURL=typeUtils.d.ts.map

export interface BitBadgeCollection {
    collectionId: number;
    collectionUri: string;
    badgeUri: string;
    bytes: string;
    manager: BitBadgesUserInfo;
    permissions: Permissions;
    disallowedTransfers: TransferMapping[];
    managerApprovedTransfers: TransferMapping[];
    nextBadgeId: number;
    unmintedSupplys: Balance[];
    maxSupplys: Balance[];
    claims: Claims[];
    standard: number;
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
    badgeSupplys?: SubassetSupply[];
}

export interface GetBalanceResponse {
    error?: any;
    balance?: UserBalance;
}

export interface UserBalance {
    balances: Balance[];
    approvals: Approval[];
}

export interface Approval {
    address: number;
    balances: Balance[];
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
