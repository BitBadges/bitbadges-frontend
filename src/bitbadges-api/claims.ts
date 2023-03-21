import { AccountsContextType } from "../contexts/AccountsContext";
import { getBalanceAfterTransfer, getBalanceAfterTransfers } from "./balances";
import { BitBadgesUserInfo, ClaimItem, Claims, TransfersExtended, UserBalance } from "./types";

export const getTransfersFromClaimItems = (claimItems: ClaimItem[], accounts: AccountsContextType) => {
    const transfers: TransfersExtended[] = [];
    for (const claimItem of claimItems) {

        //Fetch account information of recipients
        const toAddresses: number[] = [];
        const toAddressesInfo: BitBadgesUserInfo[] = [];
        for (const address of claimItem.addresses) {
            const amount = 1;
            const accountNum = accounts.accounts[address].accountNumber ? accounts.accounts[address].accountNumber : -1;

            const toPush: number[] = new Array(amount).fill(accountNum)
            toAddresses.push(...toPush);
            toAddressesInfo.push(...new Array(amount).fill(accounts.accounts[address]));
        }

        //If badges are incremented, we create N unique transfers. Else, we can create one transfer
        if (claimItem.incrementIdsBy && claimItem.numIncrements) {
            const currBadgeIds = JSON.parse(JSON.stringify(claimItem.badgeIds))
            for (let i = 0; i < toAddresses.length; i++) {
                transfers.push({
                    toAddresses: [toAddresses[i]],
                    toAddressInfo: [toAddressesInfo[i]],
                    numCodes: 0,
                    balances: [{
                        balance: claimItem.amount,
                        badgeIds: JSON.parse(JSON.stringify(currBadgeIds)),
                    }],
                    numIncrements: 0,
                    incrementBy: 0,
                })

                for (let j = 0; j < currBadgeIds.length; j++) {
                    currBadgeIds[j].start += claimItem.incrementIdsBy;
                    currBadgeIds[j].end += claimItem.incrementIdsBy;
                }
            }
        } else {
            transfers.push({
                toAddresses,
                toAddressInfo: toAddressesInfo,
                numCodes: claimItem.codes.length,
                balances: [{
                    balance: claimItem.amount,
                    badgeIds: claimItem.badgeIds,
                }],
                numIncrements: claimItem.numIncrements,
                incrementBy: claimItem.incrementIdsBy,
                password: claimItem.password,
            })
        }
    }

    return transfers;
}

export const getClaimsFromClaimItems = (balance: UserBalance, claimItems: ClaimItem[]) => {
    let undistributedBalance = JSON.parse(JSON.stringify(balance));

    const claims: Claims[] = [];

    for (const claimItem of claimItems) {
        let claimBalance = JSON.parse(JSON.stringify(undistributedBalance));
        let maxNumClaims = 0;
        const codesLength = claimItem.codes.length;
        const addressesLength = claimItem.addresses.length;

        if (claimItem.limitPerAccount === 0) { //No restrictions (0) or one per address (2)
            maxNumClaims = codesLength;
        } else if (claimItem.limitPerAccount === 1 || claimItem.limitPerAccount === 2) { //By whitelist index
            if (codesLength > 0 && addressesLength > 0) {
                maxNumClaims = Math.min(codesLength, addressesLength);
            } else if (codesLength > 0) {
                maxNumClaims = codesLength;
            } else if (addressesLength > 0) {
                maxNumClaims = addressesLength;
            }
        }

        if (maxNumClaims > 0) {
            const transfers = [
                {
                    toAddresses: [0],
                    balances: [
                        {
                            badgeIds: claimItem.badgeIds,
                            balance: claimItem.amount
                        }
                    ],
                    numIncrements: maxNumClaims,
                    incrementBy: claimItem.incrementIdsBy,
                }
            ];

            //For all possible transfers, remove from undistributedBalance 
            undistributedBalance.balances = getBalanceAfterTransfers(undistributedBalance, transfers).balances;

            //Set claim balance to what was just removed in the line above
            for (const balanceObj of undistributedBalance.balances) {
                for (const badgeId of balanceObj.badgeIds) {
                    const newBalance = getBalanceAfterTransfer(claimBalance, badgeId.start, badgeId.end, balanceObj.balance, 1);
                    claimBalance.balances = newBalance.balances;
                }
            }
        } else {
            claimBalance = undistributedBalance;
            balance = {
                balances: [],
                approvals: [],
            }
        }

        claims.push({
            balances: claimBalance.balances,
            codeRoot: claimItem.codeRoot,
            whitelistRoot: claimItem.whitelistRoot,
            uri: claimItem.uri,
            timeRange: claimItem.timeRange,
            limitPerAccount: claimItem.limitPerAccount,
            amount: claimItem.amount,
            badgeIds: claimItem.badgeIds,
            incrementIdsBy: claimItem.incrementIdsBy,
            expectedMerkleProofLength: claimItem.codeTree.getLayerCount() - 1,
        })
    }

    return {
        undistributedBalance,
        claims
    }
}