import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { GO_MAX_UINT_64 } from "../constants";
import { ChainContextType } from "../contexts/ChainContext";
import { GetPermissions } from "./permissions";
import { ActivityItem, BadgeMetadata, BadgeMetadataMap, BitBadgeCollection, BitBadgesUserInfo, ClaimItem, DistributionMethod, IdRange, TransferMapping, UserBalance } from "./types";
import MerkleTree from "merkletreejs";
import { SHA256 } from "crypto-js";
import { getPostTransferBalance } from "./balances";
import { SearchIdRangesForId } from "./idRanges";

export function filterBadgeActivityForBadgeId(badgeId: number, activity: ActivityItem[]) {
    return activity.filter((x) => {
        for (const balance of x.balances) {
            for (const badgeIdRange of balance.badgeIds) {
                if (badgeId >= badgeIdRange.start && badgeId <= badgeIdRange.end) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    }) as ActivityItem[];
}

export function getFullBadgeIdRanges(collection: BitBadgeCollection) {
    const range: IdRange = {
        start: 1,
        end: collection.nextBadgeId - 1,
    }
    return [range];
}

export function createCollectionFromMsgNewCollection(
    msgNewCollection: MessageMsgNewCollection,
    collectionMetadata: BadgeMetadata,
    individualBadgeMetadata: BadgeMetadataMap,
    chain: ChainContextType,
    claimItems: ClaimItem[],
    distributionMethod: DistributionMethod,
    existingCollection?: BitBadgeCollection,
) {
    let nextBadgeId = existingCollection?.nextBadgeId ? existingCollection.nextBadgeId : 1;
    let newMaxSupplys = existingCollection?.maxSupplys ? [...existingCollection.maxSupplys] : [];
    let newUnmintedSupplys = existingCollection?.unmintedSupplys ? [...existingCollection.unmintedSupplys] : [];

    for (const supplyObj of msgNewCollection.badgeSupplys) {
        nextBadgeId += supplyObj.amount;
        newMaxSupplys.push({
            balance: supplyObj.supply,
            badgeIds: [{
                start: nextBadgeId - supplyObj.amount,
                end: nextBadgeId - 1,
            }]
        })
        newUnmintedSupplys.push({
            balance: supplyObj.supply,
            badgeIds: [{
                start: nextBadgeId - supplyObj.amount,
                end: nextBadgeId - 1,
            }]
        })
    }

    let unmintedBalances: UserBalance = {
        balances: newUnmintedSupplys,
        approvals: [],
    };

    for (const transfer of msgNewCollection.transfers) {
        for (const _ of transfer.toAddresses) {
            for (const balance of transfer.balances) {
                for (const badgeId of balance.badgeIds) {
                    console.log("TRANSFER", badgeId.start, badgeId.end, balance.balance, 1);
                    unmintedBalances = getPostTransferBalance(unmintedBalances, badgeId.start, badgeId.end, balance.balance, 1);
                }
            }
        }
    }



    const newClaims = [...existingCollection?.claims ? existingCollection.claims : [], ...msgNewCollection.claims.map((x) => {
        return {
            ...x,
            leaves: claimItems.map((y) => y.fullCode),
            distributionMethod,
            tree: new MerkleTree(claimItems.map((x) => SHA256(x.fullCode)), SHA256),
            claimItems: claimItems,
        }
    })];

    for (const claim of msgNewCollection.claims) {
        for (const balance of claim.balances) {
            for (const badgeId of balance.badgeIds) {
                console.log("CLAIM", badgeId.start, badgeId.end, balance.balance, 1);
                unmintedBalances = getPostTransferBalance(unmintedBalances, badgeId.start, badgeId.end, balance.balance, 1);
            }
        }
    }



    const badgeCollection: BitBadgeCollection = {
        ...msgNewCollection,
        collectionId: existingCollection?.collectionId ? existingCollection.collectionId : 0,
        manager: existingCollection?.manager ? existingCollection.manager : {
            chain: chain.chain,
            accountNumber: chain.accountNumber,
            address: chain.address,
            cosmosAddress: chain.cosmosAddress,
        },
        badgeMetadata: individualBadgeMetadata,
        collectionMetadata: collectionMetadata,
        //The next three are fine because we only show pre
        permissions: GetPermissions(msgNewCollection.permissions),
        disallowedTransfers: msgNewCollection?.disallowedTransfers ? msgNewCollection.disallowedTransfers : existingCollection?.disallowedTransfers ? existingCollection.disallowedTransfers : [],
        managerApprovedTransfers: msgNewCollection?.managerApprovedTransfers ? msgNewCollection.managerApprovedTransfers : existingCollection?.managerApprovedTransfers ? existingCollection.managerApprovedTransfers : [],
        activity: [],
        usedClaims: [],
        managerRequests: [],
        nextBadgeId: nextBadgeId,
        claims: newClaims,
        originalClaims: newClaims,
        unmintedSupplys: unmintedBalances.balances,
        maxSupplys: newMaxSupplys,
        balances: {}, //Can support this later
    }



    return badgeCollection;
}

export const getNonTransferableDisallowedTransfers = () => {
    return [AllAddressesTransferMapping]
}

export const AllAddressesTransferMapping: TransferMapping = {

    from: {
        accountNums: [
            {
                start: 0,
                end: GO_MAX_UINT_64
            }
        ],
        options: 0,
    },
    to: {
        accountNums: [
            {
                start: 0,
                end: GO_MAX_UINT_64
            }
        ],
        options: 0,
    },
}

export const getMatchingAddressesFromTransferMapping = (mapping: TransferMapping[], toAddresses: BitBadgesUserInfo[], chain: ChainContextType, managerAccountNumber: number) => {
    const matchingAddresses: any[] = [];
    for (const address of toAddresses) {
        for (const transfer of mapping) {
            let fromIsApproved = false;
            let toIsApproved = false;

            if (transfer.from.options === 2 && chain.accountNumber === managerAccountNumber) {
                //exclude manager and we are the manager
                fromIsApproved = false;
            } else {
                if (transfer.from.options === 1) {
                    //include manager and we are the manager
                    if (chain.accountNumber === managerAccountNumber) {
                        fromIsApproved = true;
                    }
                }


                for (const idRange of transfer.from.accountNums) {
                    if (idRange.start <= chain.accountNumber && idRange.end >= chain.accountNumber) {
                        fromIsApproved = true;
                        break;
                    }
                }
            }

            if (transfer.to.options === 2 && address.accountNumber === managerAccountNumber) {
                //exclude manager and we are the manager
                toIsApproved = false;
            } else {
                if (transfer.to.options === 1) {
                    //include manager and we are the manager
                    if (address.accountNumber === managerAccountNumber) {
                        toIsApproved = true;
                    }
                }

                for (const idRange of transfer.to.accountNums) {
                    if (idRange.start <= address.accountNumber && idRange.end >= address.accountNumber) {
                        toIsApproved = true;
                        break;
                    }
                }
            }

            if (fromIsApproved && toIsApproved) {
                matchingAddresses.push(address);
            }
        }
    }

    return matchingAddresses;
}

export function getMetadataForBadgeId(badgeId: number, metadataMap: BadgeMetadataMap) {
    let currentMetadata = {} as BadgeMetadata;
    for (const val of Object.values(metadataMap)) {
        const res = SearchIdRangesForId(badgeId, val.badgeIds)
        const found = res[1]
        if (found) {
            currentMetadata = val.metadata;
            break;
        }
    }

    return currentMetadata;
}