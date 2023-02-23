//TODO: clean this up and put it in bitbadges-js
import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SubtractBalancesForIdRanges } from "./balances-gpt";
import { Balance, BitBadgeCollection, UserBalance } from "./types";

export const getBlankBalance = () => {
    const blankBalance: UserBalance = {
        balances: [],
        approvals: [],
    }
    return blankBalance;
}

export const getPostTransferBalance = (balance: UserBalance, startSubbadgeId: number, endSubbadgeId: number, amountToTransfer: number, numRecipients: number) => {
    let balanceCopy = JSON.parse(JSON.stringify(balance)); // need a deep copy of the balance to not mess up calculations
    let newBalance = SubtractBalancesForIdRanges(balanceCopy, [{ start: startSubbadgeId, end: endSubbadgeId }], amountToTransfer * numRecipients);
    return newBalance;
}

export const getBadgeSupplysFromMsgNewCollection = (msgNewCollection: MessageMsgNewCollection, collection?: BitBadgeCollection) => {
    const balances = [];
    console.log("collection", collection);
    let nextBadgeId = 1;
    if (collection?.maxSupplys) {
        balances.push(...collection.maxSupplys);
    }

    let maxBadgeId = 1;
    for (const balance of collection?.maxSupplys ?? []) {
        for (const badgeIdRange of balance.badgeIds) {
            if (badgeIdRange.end >= maxBadgeId) {
                maxBadgeId = badgeIdRange.end;
                nextBadgeId = maxBadgeId + 1;
            }
        }
    }





    console.log("BADGE SUPPLYS", msgNewCollection.badgeSupplys);
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

    console.log("XXX BALANCES", balances);

    const beforeBalances: UserBalance = {
        balances: balances,
        approvals: [],
    }
    return beforeBalances;
}

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