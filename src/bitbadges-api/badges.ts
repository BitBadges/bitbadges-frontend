import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { ChainContextType } from "../chain/ChainContext";
import { GetPermissions } from "./permissions";
import { BadgeMetadata, BitBadgeCollection, IdRange } from "./types";

export function getFullBadgeIdRanges(collection: BitBadgeCollection) {
    const range: IdRange = {
        start: 0,
        end: collection.nextBadgeId - 1,
    }
    return [range];
}

export function createCollectionFromMsgNewCollection(
    msgNewCollection: MessageMsgNewCollection,
    collectionMetadata: BadgeMetadata,
    individualBadgeMetadata: BadgeMetadata[],
    chain: ChainContextType,
    collection?: BitBadgeCollection
) {

    const badgeCollection: BitBadgeCollection = {
        ...msgNewCollection,
        collectionId: collection?.collectionId ? collection.collectionId : 0,
        manager: {
            chain: chain.chain,
            accountNumber: chain.accountNumber,
            address: chain.address,
            cosmosAddress: chain.cosmosAddress,
        },
        nextBadgeId: msgNewCollection.badgeSupplys[0] ? msgNewCollection.badgeSupplys[0].amount : collection?.nextBadgeId ? collection?.nextBadgeId : 0,
        badgeMetadata: individualBadgeMetadata,
        collectionMetadata: collectionMetadata,
        unmintedSupplys: [],
        maxSupplys: [],
        permissions: GetPermissions(msgNewCollection.permissions),
        disallowedTransfers: [],
        managerApprovedTransfers: [],
        claims: [],
        activity: [],
    }

    return badgeCollection;
}

export function createCollectionFromMsgMintBadge(
    msgNewCollection: MessageMsgNewCollection,
    currCollection: BitBadgeCollection,
    collectionMetadata: BadgeMetadata,
    individualBadgeMetadata: BadgeMetadata[],
    chain: ChainContextType
) {

    const badgeCollection: BitBadgeCollection = {
        ...currCollection,
        nextBadgeId: msgNewCollection.badgeSupplys[0] ? msgNewCollection.badgeSupplys[0].amount + currCollection.nextBadgeId - 1 : 0,
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
    return [
        {
            to: {
                accountNums: [
                    {
                        start: 0,
                        end: 1000 //TODO: change to max uint64
                    }
                ],
                options: 0,
            },
            from: {
                accountNums: [
                    {
                        start: 0,
                        end: 1000 //TODO: change to max uint64
                    }
                ],
                options: 0,
            },
        },
    ]
}