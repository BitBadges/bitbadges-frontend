//TODO: clean this up and put it in bitbadges-js
import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SubtractBalancesForIdRanges } from "./balances-gpt";
import { BitBadgeCollection, UserBalance } from "./types";

export const getPostTransferBalance = (balance: UserBalance, startSubbadgeId: number, endSubbadgeId: number, amountToTransfer: number, numRecipients: number) => {
    let newBalance = SubtractBalancesForIdRanges(balance, [{ start: startSubbadgeId, end: endSubbadgeId }], amountToTransfer * numRecipients);
    return newBalance;
}

export const getBadgeSupplysFromMsgNewCollection = (msgNewCollection: MessageMsgNewCollection) => {
    const beforeBalances: UserBalance = {
        balances: [
            {
                balance: msgNewCollection.badgeSupplys[0]?.supply,
                badgeIds: [{
                    start: 0,
                    end: msgNewCollection.badgeSupplys[0]?.amount - 1,
                }]
            }
        ],
        approvals: [],
    }
    return beforeBalances;
}
