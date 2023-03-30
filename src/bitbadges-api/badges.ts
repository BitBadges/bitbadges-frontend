import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { GO_MAX_UINT_64, METADATA_PAGE_LIMIT } from "../constants";
import { ChainContextType } from "../contexts/ChainContext";
import { getBalanceAfterTransfers } from "./balances";
import { getClaimsFromClaimItems } from "./claims";
import { SearchIdRangesForId } from "./idRanges";
import { GetPermissions } from "./permissions";
import { ActivityItem, Addresses, BadgeMetadata, BadgeMetadataMap, Balance, BitBadgeCollection, BitBadgesUserInfo, ClaimItem, IdRange, TransferMapping, UserBalance } from "./types";
import { CollectionsContextType } from "../contexts/CollectionsContext";
import { GetBalancesForIdRanges } from "./balances-gpt";

export function filterBadgeActivityForBadgeId(badgeId: number, activity: ActivityItem[]) {
    return activity.filter((x) => {
        for (const balance of x.balances) {
            const [_idx, found] = SearchIdRangesForId(badgeId, balance.badgeIds);
            return found;
        }
    }) as ActivityItem[];
}

export function getIdRangesForAllBadgeIdsInCollection(collection: BitBadgeCollection) {
    const range: IdRange = {
        start: 1,
        end: collection.nextBadgeId - 1,
    }
    return [range];
}

//Simulate what the collection will look like after the new Msg is to be processed
export function createCollectionFromMsgNewCollection(
    msgNewCollection: MessageMsgNewCollection,
    collectionMetadata: BadgeMetadata,
    individualBadgeMetadata: BadgeMetadataMap,
    chain: ChainContextType,
    claimItems: ClaimItem[],
    existingCollection?: BitBadgeCollection,
) {
    let nextBadgeId = existingCollection?.nextBadgeId ? existingCollection.nextBadgeId : 1;

    //Calculate the amounts and supplys of badges (existing + new)
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


    //Calculate the unmintedBalances
    let unmintedBalances: UserBalance = {
        balances: newUnmintedSupplys,
        approvals: [],
    };

    unmintedBalances = getBalanceAfterTransfers(unmintedBalances, msgNewCollection.transfers);

    const claimsRes = getClaimsFromClaimItems(unmintedBalances, claimItems);
    const newClaims = [...existingCollection?.claims ? existingCollection.claims : [], ...claimItems];
    unmintedBalances = claimsRes.undistributedBalance;

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
        permissions: GetPermissions(msgNewCollection.permissions),
        disallowedTransfers: msgNewCollection?.disallowedTransfers ? msgNewCollection.disallowedTransfers : existingCollection?.disallowedTransfers ? existingCollection.disallowedTransfers : [],
        managerApprovedTransfers: msgNewCollection?.managerApprovedTransfers ? msgNewCollection.managerApprovedTransfers : existingCollection?.managerApprovedTransfers ? existingCollection.managerApprovedTransfers : [],
        activity: [],
        usedClaims: {},
        managerRequests: [],
        nextBadgeId: nextBadgeId,
        claims: newClaims,
        originalClaims: newClaims,
        unmintedSupplys: unmintedBalances.balances,
        maxSupplys: newMaxSupplys,
        balances: {}, //Balances are currently not supported for simulated previews
    }

    return badgeCollection;
}

export const getNonTransferableDisallowedTransfers = () => {
    return [JSON.parse(JSON.stringify(AllAddressesTransferMapping))];
}

export const AllAddressesTransferMapping: TransferMapping = Object.freeze({
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
})

export const checkIfApprovedInTransferMapping = (addresses: Addresses, chain: ChainContextType, managerAccountNumber: number) => {
    let isApproved = false;
    if (addresses.options === 2 && chain.accountNumber === managerAccountNumber) {
        //exclude manager and we are the manager
        isApproved = false;
    } else {
        if (addresses.options === 1) {
            //include manager and we are the manager
            if (chain.accountNumber === managerAccountNumber) {
                isApproved = true;
            }
        }

        for (const idRange of addresses.accountNums) {
            if (idRange.start <= chain.accountNumber && idRange.end >= chain.accountNumber) {
                isApproved = true;
            }
        }
    }

    return isApproved;
}

export const getMatchingAddressesFromTransferMapping = (mapping: TransferMapping[], toAddresses: BitBadgesUserInfo[], chain: ChainContextType, managerAccountNumber: number) => {
    const matchingAddresses: any[] = [];
    for (const address of toAddresses) {
        for (const transfer of mapping) {
            let fromIsApproved = checkIfApprovedInTransferMapping(transfer.from, chain, managerAccountNumber);
            let toIsApproved = checkIfApprovedInTransferMapping(transfer.to, chain, managerAccountNumber);

            if (fromIsApproved && toIsApproved) {
                matchingAddresses.push(address);
            }
        }
    }

    return matchingAddresses;
}

//Returns the { metadata, uri, badgeIds } metadata object for a specific badgeId
export function getMetadataMapObjForBadgeId(badgeId: number, metadataMap: BadgeMetadataMap) {
    let currentMetadata = undefined;
    for (const val of Object.values(metadataMap)) {
        const [_idx, found] = SearchIdRangesForId(badgeId, val.badgeIds)
        if (found) {
            return val;
        }
    }

    return currentMetadata;
}

//Returns just the metadata for a specific badgeId
export function getMetadataForBadgeId(badgeId: number, metadataMap: BadgeMetadataMap) {
    let currentMetadata = undefined;
    for (const val of Object.values(metadataMap)) {
        const [_idx, found] = SearchIdRangesForId(badgeId, val.badgeIds);
        if (found) {
            return val.metadata;
        }
    }

    return currentMetadata;
}

//Returns an array of pageSize length with the badgeIds to display for a speciifc page
//Will jump over ranges if needed (e.g. [1, 2, 3, 7, 8, 9, 11, ....])
export function getBadgeIdsToDisplayForPageNumber(badgeIds: IdRange[], startIdxNum: number, pageSize: number) {
    let currIdx = 0;
    let numEntriesLeftToHandle = pageSize;
    let badgeIdsToDisplay: number[] = [];
    for (const range of badgeIds) {
        const numBadgesInRange = Number(range.end) - Number(range.start) + 1;

        // If we have reached the start of the page, handle this range
        if (currIdx + numBadgesInRange >= startIdxNum) {
            //Find badge ID to start at
            let currBadgeId = Number(range.start);
            if (currIdx < startIdxNum) {
                currBadgeId = Number(range.start) + (startIdxNum - currIdx);
            }

            while (numEntriesLeftToHandle > 0 && currBadgeId <= Number(range.end)) {
                badgeIdsToDisplay.push(currBadgeId);
                numEntriesLeftToHandle--;
                currBadgeId++;
            }
        }

        currIdx += numBadgesInRange;
    }

    return badgeIdsToDisplay;
}

/* This is the logic we use to determine the metadata batch idx for a collection in our indexer
    Batch 0 = collectionMetadata
    Batch 1 = metadata for 1st batch of badges
    Batch 2 = metadata for 2nd batch of badges
    And so on
    This returns the max batch index
*/
export function getMaxBatchId(collection: BitBadgeCollection) {
    let batchIdx = 1;
    for (const badgeUri of collection.badgeUris) {
        // If the URI contains {id}, each badge ID will belong to its own private batch
        if (badgeUri.uri.includes("{id}")) {
            for (const badgeIdRange of badgeUri.badgeIds) {
                batchIdx += Number(badgeIdRange.end) - Number(badgeIdRange.start) + 1;
            }
        } else {
            batchIdx++;
        }
    }

    return batchIdx;
}

//Iterates through the current badge metadata and puts in any new requests for badges that are displayed but have missing metadata 
export function updateMetadataForBadgeIdsFromIndexerIfAbsent(badgeIdsToDisplay: number[], collection: BitBadgeCollection, collections: CollectionsContextType) {
    //Find the batchIdxs that we need to request metadata for
    let metadataBatchIdxs: number[] = [];


    for (let i = 0; i < badgeIdsToDisplay.length; i++) {
        if (!getMetadataForBadgeId(badgeIdsToDisplay[i], collection.badgeMetadata)) {
            let batchIdx = 1;

            //Find respective batchIdx for badgeIdsToDisplay[i]
            for (const badgeUri of collection.badgeUris) {
                if (badgeUri.uri.includes("{id}")) {
                    const [idx, found] = SearchIdRangesForId(badgeIdsToDisplay[i], badgeUri.badgeIds);
                    if (found) {
                        const badgeIdRange = badgeUri.badgeIds[idx];
                        if (!metadataBatchIdxs.includes(batchIdx + badgeIdsToDisplay[i] - Number(badgeIdRange.start))) {
                            metadataBatchIdxs.push(batchIdx + badgeIdsToDisplay[i] - Number(badgeIdRange.start));
                        }
                    }

                    for (const badgeIdRange of badgeUri.badgeIds) {
                        batchIdx += Number(badgeIdRange.end) - Number(badgeIdRange.start) + 1;
                    }
                } else {
                    const [_idx, found] = SearchIdRangesForId(badgeIdsToDisplay[i], badgeUri.badgeIds);
                    if (found) {
                        if (!metadataBatchIdxs.includes(batchIdx)) {
                            metadataBatchIdxs.push(batchIdx);
                        }
                    }
                    batchIdx++;
                }
            }
        }
    }

    // By default, we batch update metadata for METADATA_PAGE_LIMIT badges at a time (i.e. idxToUpdate + METADATA_PAGE_LIMIT)
    // So here, remove redundant idxs (i.e. idxToUpdate + METADATA_PAGE_LIMIT) that are already in metadataBatchIdxs
    let idxsToUpdate: number[] = [];
    for (let i = 0; i < metadataBatchIdxs[metadataBatchIdxs.length - 1]; i += METADATA_PAGE_LIMIT) {
        if (metadataBatchIdxs.some(idx => idx >= i && idx < i + METADATA_PAGE_LIMIT)) {
            idxsToUpdate.push(i);
        }
    }

    collections.updateCollectionMetadata(collection.collectionId, idxsToUpdate);
}

export function checkIfApproved(userBalance: UserBalance, accountNumber: number, balancesToCheck: Balance[]) {
    let isApproved = true;
    const approval = userBalance.approvals.find((approval) => approval.address === accountNumber);
    if (!approval || (approval && approval.balances.length === 0)) {
        isApproved = false;
    } else {
        for (const balance of balancesToCheck) {
            const approvalBalances = GetBalancesForIdRanges(balance.badgeIds, approval?.balances || []);

            if (approvalBalances.length === 0) {
                isApproved = false;
            } else {
                for (const approvalBalance of approvalBalances) {
                    if (approvalBalance.balance < balance.balance) {
                        isApproved = false;
                        break;
                    }
                }
            }
        }
    }

    return isApproved;
}