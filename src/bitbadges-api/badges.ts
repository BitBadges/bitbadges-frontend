import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { BadgeMetadata, BitBadgeCollection } from "./types";
import { ChainContextType } from "../chain/ChainContext";
import { GetPermissions } from "./permissions";

export function createCollectionFromMsgNewCollection(
    msgNewCollection: MessageMsgNewCollection,
    collectionMetadata: BadgeMetadata,
    individualBadgeMetadata: BadgeMetadata[],
    chain: ChainContextType
) {

    const badgeCollection: BitBadgeCollection = {
        ...msgNewCollection,
        collectionId: 0,
        manager: {
            chain: chain.chain,
            accountNumber: chain.accountNumber,
            address: chain.address,
            cosmosAddress: chain.cosmosAddress,
        },
        nextBadgeId: msgNewCollection.badgeSupplys[0] ? msgNewCollection.badgeSupplys[0].amount : 0,
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