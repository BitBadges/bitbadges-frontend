//TODO: clean this up and put it in bitbadges-js
import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SubtractBalancesForIdRanges } from "./balances-gpt";
import { Balance, BitBadgeCollection, TransfersExtended, UserBalance } from "./types";

export const getBlankBalance = () => {
    const blankBalance: UserBalance = {
        balances: [],
        approvals: [],
    }
    return blankBalance;
}

export const getBalanceAfterTransfer = (balance: UserBalance, startSubbadgeId: number, endSubbadgeId: number, amountToTransfer: number, numRecipients: number) => {
    let balanceCopy = JSON.parse(JSON.stringify(balance)); //need a deep copy of the balance to not mess up calculations
    let newBalance = SubtractBalancesForIdRanges(balanceCopy, [{ start: startSubbadgeId, end: endSubbadgeId }], amountToTransfer * numRecipients);
    return newBalance;
}

export const getBalanceAfterTransfers = (balance: UserBalance, transfers: TransfersExtended[]) => {
    let postBalance: UserBalance = JSON.parse(JSON.stringify(balance)); //need a deep copy of the balance to not mess up calculations


    for (const transfer of transfers) {
        const numRecipients = transfer.numIncrements ? transfer.numIncrements : transfer.toAddresses.length
        for (const balance of transfer.balances) {
            const incrementedBadgeIds = JSON.parse(JSON.stringify(balance.badgeIds));
            for (const badgeId of incrementedBadgeIds) {
                postBalance = getBalanceAfterTransfer(postBalance, badgeId.start, badgeId.end, balance.balance, numRecipients);
            }

            if (transfer.incrementBy) {
                for (const idRange of incrementedBadgeIds) {
                    idRange.start += transfer.incrementBy;
                    idRange.end += transfer.incrementBy;
                }
            }
        }
    }

    return postBalance;
}

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
    let supply = balances.find((supply) => {
        return supply.badgeIds.find((idRange) => {
            if (idRange.start === undefined || idRange.end === undefined) {
                return false;
            }
            return badgeId >= idRange.start && badgeId <= idRange.end;
        });
    });

    return supply?.balance ?? 0;
}