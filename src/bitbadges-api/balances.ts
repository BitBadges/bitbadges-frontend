//TODO: clean this up and put it in bitbadges-js
import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SubtractBalancesForIdRanges } from "./balances-gpt";
import { Balance, BitBadgeCollection, TransfersExtended, UserBalance } from "./types";
import { SearchIdRangesForId } from "./idRanges";

export const getBlankBalance = () => {
    const blankBalance: UserBalance = {
        balances: [],
        approvals: [],
    }
    return blankBalance;
}

//Gets badge balance after a transfer takes place
export const getBalanceAfterTransfer = (balance: UserBalance, startSubbadgeId: number, endSubbadgeId: number, amountToTransfer: number, numRecipients: number) => {
    let balanceCopy = JSON.parse(JSON.stringify(balance)); //need a deep copy of the balance to not mess up calculations
    let newBalance = SubtractBalancesForIdRanges(balanceCopy, [{ start: startSubbadgeId, end: endSubbadgeId }], amountToTransfer * numRecipients);
    return newBalance;
}

//Gets badge balance for a Transfers[] object (w/ support for increments, codes, and claims)
export const getBalanceAfterTransfers = (balance: UserBalance, transfers: TransfersExtended[]) => {
    let postBalance: UserBalance = JSON.parse(JSON.stringify(balance)); //need a deep copy of the balance to not mess up calculations

    for (const transfer of transfers) {
        for (const balance of transfer.balances) {
            let numRecipients = transfer.numCodes ? transfer.numCodes : transfer.toAddresses.length;
            if (transfer.incrementBy && transfer.numIncrements) {
                numRecipients = 1;
            }

            const incrementedBadgeIds = JSON.parse(JSON.stringify(balance.badgeIds));
            for (const idRange of incrementedBadgeIds) {
                if (transfer.incrementBy && transfer.numIncrements) {
                    idRange.end += (transfer.incrementBy * (transfer.numIncrements - 1));
                }
            }

            for (const badgeId of incrementedBadgeIds) {
                postBalance = getBalanceAfterTransfer(postBalance, badgeId.start, badgeId.end, balance.balance, numRecipients);
            }
        }
    }

    return postBalance;
}

//TODO: redundancies with createCollectionFromMsgNewCollection in badges.ts
export const getBadgeSupplysFromMsgNewCollection = (msgNewCollection: MessageMsgNewCollection, existingCollection?: BitBadgeCollection) => {
    const balances = [];
    //Handle if badges were already previously minted
    let nextBadgeId = 1;
    let maxBadgeId = 1;
    if (existingCollection?.maxSupplys) {
        balances.push(...existingCollection.maxSupplys);
    }

    for (const balance of existingCollection?.maxSupplys ?? []) {
        for (const badgeIdRange of balance.badgeIds) {
            if (badgeIdRange.end >= maxBadgeId) {
                maxBadgeId = badgeIdRange.end;
                nextBadgeId = maxBadgeId + 1;
            }
        }
    }

    //Handle new badges that will be minted
    for (const supplyObj of msgNewCollection.badgeSupplys) {
        balances.push({
            balance: supplyObj.supply,
            badgeIds: [{
                start: nextBadgeId,
                end: nextBadgeId + supplyObj.amount - 1,
            }]
        });
        nextBadgeId += supplyObj.amount;
    }


    const retBalances: UserBalance = {
        balances: balances,
        approvals: [],
    }
    return retBalances;
}

//Gets the supply of a specific badgeId
export const getSupplyByBadgeId = (badgeId: number, balances: Balance[]) => {
    for (const balance of balances) {
        const [_idx, found] = SearchIdRangesForId(badgeId, balance.badgeIds);
        if (found) {
            return balance.balance;
        }
    }
    return 0;
}