import { AddBalancesForIdRanges, BalancesMap, Transfers, getBalanceAfterTransfers } from "bitbadgesjs-utils";

export const handleTransfers = async (from: (number | 'Mint')[], transfers: Transfers[]) => {
    const balanceMap: BalancesMap = {};

    //Calculate new balances of the toAddresses
    for (let idx = 0; idx < transfers.length; idx++) {
        const transfer = transfers[idx];
        for (let j = 0; j < transfer.toAddresses.length; j++) {
            const address = transfer.toAddresses[j];

            //currBalance is used as a UserBalance type to be compatible with AddBalancesForIdRanges
            const currBalance = balanceMap[address]
                ? balanceMap[address]
                : { balances: [], approvals: [] };

            for (const transferBalanceObj of transfer.balances) {
                balanceMap[address] = AddBalancesForIdRanges(currBalance, transferBalanceObj.badgeIds, transferBalanceObj.balance);
            }
        }
    }

    for (const fromAddress of from) {
        if (fromAddress === 'Mint') continue;

        //Deduct balances from the fromAddress
        balanceMap[fromAddress] = getBalanceAfterTransfers(
            {
                balances: balanceMap[fromAddress].balances,
                approvals: [],
            },
            transfers
        );
    }

    return balanceMap;
}

  