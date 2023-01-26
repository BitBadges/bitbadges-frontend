//TODO: clean this up and put it in bitbadges-js
import { SubtractBalancesForIdRanges } from "./balances-gpt";
import { BitBadgeCollection, UserBalance } from "./types";

export const getPostTransferBalance = (balance: UserBalance, collection: BitBadgeCollection, startSubbadgeId: number, endSubbadgeId: number, amountToTransfer: number, numRecipients: number) => {
    let newBalance = SubtractBalancesForIdRanges(balance, [{ start: startSubbadgeId, end: endSubbadgeId }], amountToTransfer * numRecipients);
    return newBalance;
}

