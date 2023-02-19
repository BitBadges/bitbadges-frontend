//TODO: clean this up and put it in bitbadges-js
import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SubtractBalancesForIdRanges } from "./balances-gpt";
import { Balance, UserBalance } from "./types";

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

export const getBadgeSupplysFromMsgNewCollection = (msgNewCollection: MessageMsgNewCollection) => {
    const beforeBalances: UserBalance = {
        balances: [
            {
                balance: msgNewCollection.badgeSupplys[0]?.supply,
                badgeIds: [{
                    start: 1,
                    end: msgNewCollection.badgeSupplys[0]?.amount,
                }]
            }
        ],
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