//TODO: clean this up and put it in bitbadges-js
import { SubtractBalancesForIdRanges } from "./balances-gpt";
import { BitBadgeCollection, UserBalance } from "./types";

export const getPostTransferBalance = (balance: UserBalance, badge: BitBadgeCollection, startSubbadgeId: number, endSubbadgeId: number, amountToTransfer: number, numRecipients: number) => {
    //TODO: 
    let normalizedBalanceAmounts = [];
    for (const balanceAmount of balance.balanceAmounts) {
        normalizedBalanceAmounts.push({
            balance: balanceAmount.balance,
            idRanges: balanceAmount.id_ranges.map(idRange => {
                if (!idRange.end) idRange.end = idRange.start;
                return {
                    start: idRange.start,
                    end: idRange.end
                }
            })
        });
    }
    let normalizedBalance = {
        balanceAmounts: normalizedBalanceAmounts,
        pendingNonce: balance.pendingNonce,
        pending: [],
        approvals: []
    }
    let newBalance = SubtractBalancesForIdRanges(normalizedBalance, [{ start: startSubbadgeId, end: endSubbadgeId }], amountToTransfer * numRecipients);
    console.log("TEST")
    let unnormalizedBalanceAmounts = [];
    for (const balanceAmount of newBalance.balanceAmounts) {
        unnormalizedBalanceAmounts.push({
            balance: balanceAmount.balance,
            id_ranges: balanceAmount.idRanges.map(idRange => {
                if (!idRange.end) idRange.end = idRange.start;
                return {
                    start: idRange.start,
                    end: idRange.end
                }
            })
        });
    }
    let unnormalizedNewBalance = {
        balanceAmounts: unnormalizedBalanceAmounts,
        pendingNonce: newBalance.pendingNonce,
        pending: [],
        approvals: []
    }


    return unnormalizedNewBalance;
}

