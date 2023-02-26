import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { ChainContextType } from "../contexts/ChainContext";
import { GetPermissions } from "./permissions";
import { ActivityItem, BadgeMetadata, BitBadgeCollection, IdRange, TransferMapping } from "./types";
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
    individualBadgeMetadata: { [badgeId: string]: BadgeMetadata },
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
    individualBadgeMetadata: { [badgeId: string]: BadgeMetadata }
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