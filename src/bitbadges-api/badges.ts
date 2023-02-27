import { Chain, MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { ChainContextType } from "../contexts/ChainContext";
import { GetPermissions } from "./permissions";
import { ActivityItem, BadgeMetadata, BadgeMetadataMap, BitBadgeCollection, BitBadgesUserInfo, IdRange, TransferMapping } from "./types";
import { GO_MAX_UINT_64 } from "../constants";

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
    collection?: BitBadgeCollection
) {
    let nextBadgeId = 1;
    for (const supplyObj of msgNewCollection.badgeSupplys) {
        nextBadgeId += supplyObj.amount;
    }

    const badgeCollection: BitBadgeCollection = {
        ...msgNewCollection,
        collectionId: collection?.collectionId ? collection.collectionId : 0,
        manager: {
            chain: chain.chain,
            accountNumber: chain.accountNumber,
            address: chain.address,
            cosmosAddress: chain.cosmosAddress,
        },
        nextBadgeId: nextBadgeId > 1 ? nextBadgeId : collection?.nextBadgeId ? collection?.nextBadgeId : 1,
        badgeMetadata: individualBadgeMetadata,
        collectionMetadata: collectionMetadata,
        unmintedSupplys: collection?.unmintedSupplys ? collection.unmintedSupplys : [],
        maxSupplys: collection?.maxSupplys ? collection.maxSupplys : [],
        permissions: GetPermissions(msgNewCollection.permissions),
        disallowedTransfers: [],
        managerApprovedTransfers: [],
        claims: [],
        activity: [],
        usedClaims: [],
        originalClaims: [],
        managerRequests: [],
        balances: {},
    }

    return badgeCollection;
}

export function createCollectionFromMsgMintBadge(
    msgNewCollection: MessageMsgNewCollection,
    currCollection: BitBadgeCollection,
    collectionMetadata: BadgeMetadata,
    individualBadgeMetadata: BadgeMetadataMap
) {
    let nextBadgeId = 1;
    for (const supplyObj of msgNewCollection.badgeSupplys) {
        nextBadgeId += supplyObj.amount;
    }

    const badgeCollection: BitBadgeCollection = {
        ...currCollection,
        nextBadgeId: nextBadgeId > 1 ? nextBadgeId : currCollection?.nextBadgeId ? currCollection?.nextBadgeId : 1,
        badgeMetadata: individualBadgeMetadata,
        collectionMetadata: collectionMetadata,
        unmintedSupplys: [],
        maxSupplys: [],
        permissions: GetPermissions(msgNewCollection.permissions),
        disallowedTransfers: [],
        managerApprovedTransfers: [],
        claims: [],
    }

    return badgeCollection;
}

export const getNonTransferableDisallowedTransfers = () => {
    return [AllAddressesTransferMapping]
}

export const AllAddressesTransferMapping: TransferMapping = {
    to: {
        accountNums: [
            {
                start: 0,
                end: GO_MAX_UINT_64
            }
        ],
        options: 0,
    },
    from: {
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