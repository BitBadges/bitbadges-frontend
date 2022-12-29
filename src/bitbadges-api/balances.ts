//TODO: clean this up and put it in bitbadges-js

import { BitBadgeCollection, UserBalance } from "./types";

export const getPostTransferBalance = (balance: UserBalance, badge: BitBadgeCollection, startSubbadgeId: number, endSubbadgeId: number, amountToTransfer: number, numRecipients: number) => {
    let newBalanceObj: UserBalance = {
        ...balance,
    };
    let balances: number[] = [];
    for (let i = 0; i < badge.nextSubassetId; i++) {
        let currAmount = 0;
        for (const balanceObj of newBalanceObj.balanceAmounts) {
            for (const idRange of balanceObj.id_ranges) {
                if (!idRange.end) idRange.end = idRange.start;
                if (idRange.start <= i && idRange.end >= i) {
                    currAmount = balanceObj.balance;
                }
            }
        }
        if (i >= startSubbadgeId && i <= endSubbadgeId) {
            balances.push(currAmount - (amountToTransfer * numRecipients));
        } else {
            balances.push(currAmount);
        }

    }

    let newBalanceObjToSet: UserBalance = {
        ...balance,
        balanceAmounts: [],
    };
    for (let i = 0; i < balances.length; i++) {
        const balance = balances[i];
        let existingBalanceObj = newBalanceObjToSet.balanceAmounts.find((balanceObj) => balanceObj.balance === balance);
        if (existingBalanceObj) {
            existingBalanceObj.id_ranges.push({
                start: i,
                end: i,
            });
        } else {
            newBalanceObjToSet.balanceAmounts.push({
                balance,
                id_ranges: [{
                    start: i,
                    end: i,
                }]
            })
        }
    }

    for (const balanceObj of newBalanceObjToSet.balanceAmounts) {
        balanceObj.id_ranges.sort((a, b) => a.start - b.start);
        for (let i = 1; i < balanceObj.id_ranges.length; i++) {
            const idRange = balanceObj.id_ranges[i];
            const prevIdRange = balanceObj.id_ranges[i - 1];

            if (!prevIdRange.end) prevIdRange.end = prevIdRange.start;

            if (idRange.start === prevIdRange.end + 1) {
                prevIdRange.end = idRange.end;
                balanceObj.id_ranges.splice(i, 1);
                i--;
            }
        }
    }

    return newBalanceObjToSet;
}