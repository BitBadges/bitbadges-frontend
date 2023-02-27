//TODO: sync with bitbadges-js and the main libraries

import MerkleTree from "merkletreejs";
import { Permissions } from "./permissions";

export enum SupportedChain {
    ETH = 'Ethereum',
    COSMOS = 'Cosmos',
    UNKNOWN = 'Unknown',
}

export enum TransactionStatus {
    None = 0,
    AwaitingSignatureOrBroadcast = 1,
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

export interface ClaimItem {
    address: string;
    accountNum: number;
    code: string;
    amount: number;
    badgeIds: IdRange[];
    fullCode: string;
    userInfo: BitBadgesUserInfo;
}

export enum DistributionMethod {
    None,
    FirstComeFirstServe,
    Whitelist,
    Codes,
    Unminted,
}

export enum MetadataAddMethod {
    None = 'None',
    Manual = 'Manual',
    UploadUrl = 'Insert Custom Metadata Url (Advanced)',
    CSV = 'CSV',
}


export interface Claims {
    balances: Balance[];
    badgeIds: IdRange[];
    incrementIdsBy: number;
    amountPerClaim: number;
    type: number;
    data: string;
    uri: string;
    timeRange: IdRange;
    leaves: string[];
    tree: MerkleTree;
    distributionMethod: DistributionMethod;
}

export interface Proof {
    total: number;
    index: number;
    leafHash: string;
    proof: string[];
}
//# sourceMappingURL=typeUtils.d.ts.map

export enum ClaimType {
    MerkleTree = 0,
    Anyone = 1
}

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
    badgeMetadata: BadgeMetadataMap,
    activity: ActivityItem[];
    usedClaims: string[];
    originalClaims: Claims[];
    managerRequests: number[];
    balances: BalancesMap
}

export interface BadgeMetadataMap {
    [badgeId: string]: BadgeMetadata;
}

export interface CollectionMap {
    [collectionId: string]: BitBadgeCollection
}

export interface AccountMap {
    [cosmosAddress: string]: BitBadgesUserInfo;
}

export interface BalancesMap {
    [accountNumber: number]: UserBalance;
}

export interface ActivityItem {
    method: string;
    to: string[];
    from: string[];
    balances: Balance[];
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
    pub_key: string;
    address: string;
    chain: SupportedChain;
    cosmosAddress: string;
    name?: string;
}

export interface BitBadgesUserInfo {
    cosmosAddress: string,
    accountNumber: number,
    chain: string,
    address: string,
    name?: string
}
