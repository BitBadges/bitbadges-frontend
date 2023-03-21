import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { GO_MAX_UINT_64 } from "../constants";
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

export function getRangesForAllBadges(collection: BitBadgeCollection) {
    const range: IdRange = {
        start: 1,
        end: collection.nextBadgeId - 1,
    }
    return [range];
}

//Simulate what the collection will look like after the transaction is processed
export function createCollectionFromMsgNewCollection(
    msgNewCollection: MessageMsgNewCollection,
    collectionMetadata: BadgeMetadata,
    individualBadgeMetadata: BadgeMetadataMap,
    chain: ChainContextType,
    claimItems: ClaimItem[],
    existingCollection?: BitBadgeCollection,
) {
    let nextBadgeId = existingCollection?.nextBadgeId ? existingCollection.nextBadgeId : 1;

    //Calculate previous max/unminted supplys plus new max/unminted supplys
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
        //The next three are fine because we only show pre
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

export const checkIfManagerIsApproved = (addresses: Addresses, chain: ChainContextType, managerAccountNumber: number) => {
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
            let fromIsApproved = checkIfManagerIsApproved(transfer.from, chain, managerAccountNumber);
            let toIsApproved = checkIfManagerIsApproved(transfer.to, chain, managerAccountNumber);

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

export function getBadgeIdsToDisplayForPageNumber(badgeIds: IdRange[], startIdxNum: number, endIdxNum: number, pageSize: number) {


    let currIdx = 0;
    let numPagesLeftToHandle = pageSize;
    let badgeIdsToDisplay: number[] = [];
    for (const range of badgeIds) {
        const numBadgesInRange = Number(range.end) - Number(range.start) + 1;

        // If we have reached the start of the page yet, handle this range
        if (currIdx + numBadgesInRange >= startIdxNum) {
            //Find badge ID to start at
            let currBadgeId = Number(range.start);
            if (currIdx < startIdxNum) {
                currBadgeId = Number(range.start) + (startIdxNum - currIdx);
            }

            while (numPagesLeftToHandle > 0 && currBadgeId <= Number(range.end)) {
                badgeIdsToDisplay.push(currBadgeId);
                numPagesLeftToHandle--;
                currBadgeId++;
            }
        }

        currIdx += numBadgesInRange;
    }

    return badgeIdsToDisplay;
}

export function updateMetadataForBadgeIdsIfAbsent(badgeIdsToDisplay: number[], collection: BitBadgeCollection, collections: CollectionsContextType) {

    // If we don't have metadata for any of the badges to display, update the collection metadata
    let metadataBatchIdxs: number[] = [];
    for (let i = 0; i <= badgeIdsToDisplay.length; i++) {
        if (!getMetadataForBadgeId(badgeIdsToDisplay[i], collection.badgeMetadata)) {
            let idx = 0;
            for (const badgeUri of collection.badgeUris) {
                for (const badgeIdRange of badgeUri.badgeIds) {
                    if (Number(badgeIdRange.start) <= badgeIdsToDisplay[i] && Number(badgeIdRange.end) >= badgeIdsToDisplay[i]) {
                        if (!metadataBatchIdxs.includes(idx)) {
                            metadataBatchIdxs.push(idx);
                        }
                        break;
                    }
                }
                idx++;
            }
        }
    }

    // By default, we batch update metadata for 100 badges at a time (i.e. idxToUpdate + 100)
    // So here, remove redundant idxs (i.e. idxToUpdate + 100) that are already in metadataBatchIdxs
    let idxsToUpdate: number[] = [];
    for (let i = 0; i < metadataBatchIdxs[metadataBatchIdxs.length - 1]; i += 100) {
        if (metadataBatchIdxs.some(idx => idx >= i && idx < i + 100)) {
            idxsToUpdate.push(i);
        }
    }

    // Update metadata for each batch
    for (const idx of idxsToUpdate) {
        collections.updateCollectionMetadata(collection.collectionId, idx);
    }
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