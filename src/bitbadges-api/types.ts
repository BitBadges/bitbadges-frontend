//TODO: sync with bitbadges-js and the main libraries

import MerkleTree from "merkletreejs";
import { Permissions } from "./permissions";

export enum SupportedChain {
    ETH = 'Ethereum',
    COSMOS = 'Cosmos',
    UNKNOWN = 'Unknown',
}

export interface MetadataDocument {
    metadata: BadgeMetadata
    badgeIds: IdRange[]
    isCollection: boolean
    id: number | 'collection'
    uri: string
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

export interface BadgeUri {
    uri: string;
    badgeIds: IdRange[];
}

export interface TransferMapping {
    to: Addresses;
    from: Addresses;
}

export interface TransferMappingWithUnregisteredUsers extends TransferMapping {
    toUnregisteredUsers: string[];
    fromUnregisteredUsers: string[];
    removeToUsers: boolean;
    removeFromUsers: boolean;
}

export interface Addresses {
    accountNums: IdRange[];
    options: number;
}
export interface Transfers {
    toAddresses: number[];
    balances: Balance[];
}

export interface TransfersExtended extends Transfers {
    toAddressInfo?: (BitBadgesUserInfo)[],
    numCodes?: number,
    numIncrements?: number,
    incrementBy?: number,
    password?: string
    timeRange?: IdRange | undefined;
    toAddressesLength?: number;
}

export interface ClaimItem extends Claims {
    addresses: string[];
    addressesTree: MerkleTree;

    numCodes?: number;
    codes: string[];
    hashedCodes: string[]; //leaves
    codeTree: MerkleTree;

    password: string;
    hasPassword: boolean;

    numIncrements?: number;

    failedToFetch?: boolean;
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

export interface IndexerStatus {
    status: {
        block: {
            height: number;
        }
    }
}

export interface Claims {
    balances: Balance[];
    codeRoot: string;
    whitelistRoot: string;
    uri: string;
    timeRange: IdRange;
    limitPerAccount: number;
    amount: number;
    badgeIds: IdRange[];
    incrementIdsBy: number;
    expectedMerkleProofLength: number
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
    badgeUris: BadgeUri[];
    bytes: string;
    manager: BitBadgesUserInfo;
    permissions: Permissions;
    disallowedTransfers: TransferMapping[];
    managerApprovedTransfers: TransferMapping[];
    nextBadgeId: number;
    unmintedSupplys: Balance[];
    maxSupplys: Balance[];
    claims: ClaimItem[];
    standard: number;
    collectionMetadata: BadgeMetadata,
    badgeMetadata: BadgeMetadataMap,
    activity: ActivityItem[];
    usedClaims: {
        [claimId: string]: {
            codes: {
                [code: string]: number;
            },
            numUsed: number,
            addresses: {
                [cosmosAddress: string]: number;
            }
        }
    };
    originalClaims: ClaimItem[];
    managerRequests: number[];
    balances: BalancesMap
}

export interface BadgeMetadataMap {
    [batchId: string]: {
        badgeIds: IdRange[],
        metadata: BadgeMetadata,
        uri: string
    }
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
