import MerkleTree from "merkletreejs";
import { getPostTransferBalance } from "./balances";
import { BitBadgesUserInfo, ClaimItem, Claims, DistributionMethod, IdRange, Transfers, UserBalance } from "./types";
import { SHA256 } from "crypto-js";
import { GO_MAX_UINT_64 } from "../constants";
import { AccountsContextType } from "../contexts/AccountsContext";

//Claims will have the format "CODEROOT-ADDRESSROOT-AMOUNT-INCREMENT-STARTID-ENDID-STARTID-ENDID..."

export function parseClaim(fullClaimString: string) {
    const values = fullClaimString.split('-');
    const badgeIds = [];
    for (let i = 4; i < values.length; i += 2) {
        badgeIds.push({
            start: Number(values[i]),
            end: Number(values[i + 1]),
        })
    }

    const currLeaf = {
        codesRoot: values[0],
        addressRoot: values[1],
        amount: Number(values[2]),
        incrementBy: Number(values[3]),
        badgeIds: badgeIds,
        fullCode: fullClaimString,
    }

    return currLeaf;
}

export function createClaim(codeRoot: string, addressRoot: string, amount: number, incrementBy: number, badgeIds: IdRange[]) {
    let fullCode = `${codeRoot}-${addressRoot}-${amount}-${incrementBy}`
    for (const badgeId of badgeIds) {
        fullCode += `-${badgeId.start}-${badgeId.end}`
    }

    return {
        codesRoot: codeRoot,
        addressRoot: addressRoot,
        amount,
        incrementBy,
        badgeIds,
        fullCode: fullCode
    }
}

export const getTransfersFromClaimItems = (claimItems: ClaimItem[], accounts: AccountsContextType) => {
    const transfers: (Transfers & { toAddressInfo: (BitBadgesUserInfo | undefined)[] })[] = [];
    for (const claimItem of claimItems) {
        const toAddresses: number[] = [];
        const toAddressesInfo: BitBadgesUserInfo[] = [];
        for (const address of claimItem.addresses) {
            const amount = 1;
            const accountNum = accounts.accounts[address].accountNumber ? accounts.accounts[address].accountNumber : -1;

            const toPush: number[] = new Array(amount).fill(accountNum)
            toAddresses.push(...toPush);
            toAddressesInfo.push(...new Array(amount).fill(accounts.accounts[address]));
        }
        transfers.push({
            toAddresses,
            balances: [{
                balance: claimItem.amount,
                badgeIds: claimItem.badgeIds,
            }],
            toAddressInfo: toAddressesInfo,
        })
    }

    return transfers;
}

export const getClaimsValueFromClaimItems = (balance: UserBalance, claimItems: ClaimItem[]) => {
    balance = JSON.parse(JSON.stringify(balance));
    let undistributedBalance = JSON.parse(JSON.stringify(balance));

    const claims: Claims[] = [];

    for (const claimItem of claimItems) {
        let claimBalance = JSON.parse(JSON.stringify(undistributedBalance));
        let maxNumClaims = 0;
        const codesLength = claimItem.codes.length;
        const addressesLength = claimItem.addresses.length;
        if (claimItem.limitPerAccount === 0 || claimItem.limitPerAccount === 2) { //No restrictions (0) or one per address (2)
            maxNumClaims = codesLength;
        } else if (claimItem.limitPerAccount === 1) { //By whitelist index
            if (codesLength > 0 && addressesLength > 0) {
                maxNumClaims = Math.min(codesLength, addressesLength);
            } else if (codesLength > 0) {
                maxNumClaims = codesLength;
            } else if (addressesLength > 0) {
                maxNumClaims = addressesLength;
            }
        }

        if (maxNumClaims > 0) { //Else, unlimited claims and we distribute whole supply
            for (let i = 0; i < maxNumClaims; i++) {
                for (const badgeId of claimItem.badgeIds) {
                    const newBalance = getPostTransferBalance(balance, badgeId.start, badgeId.end, claimItem.amount, 1);
                    balance.balances = newBalance.balances;
                }

                if (claimItem.incrementIdsBy > 0) {
                    for (let badgeId of claimItem.badgeIds) {
                        badgeId = {
                            start: badgeId.start + claimItem.incrementIdsBy,
                            end: badgeId.end + claimItem.incrementIdsBy,
                        }
                    }
                }
            }

            if (balance.balances.length == 0) {

            }




            for (const balanceObj of balance.balances) {
                for (const badgeId of balanceObj.badgeIds) {
                    const newBalance = getPostTransferBalance(claimBalance, badgeId.start, badgeId.end, balanceObj.balance, 1);
                    claimBalance.balances = newBalance.balances;


                }
            }

            for (const balanceObj of claimBalance.balances) {
                if (balanceObj.balance > 0) {
                    const newBalance = getPostTransferBalance(undistributedBalance, balanceObj.badgeIds[0].start, balanceObj.badgeIds[0].end, balanceObj.balance, 1);
                    undistributedBalance.balances = newBalance.balances;
                }
            }
        } else {
            claimBalance = undistributedBalance;
            undistributedBalance = {
                balances: [],
                approvals: [],
            }
        }

        claims.push({
            ...claimItem,
            balances: claimBalance.balances,
        })
    }


    return {
        undistributedBalance,
        claims
    }
}