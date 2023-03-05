import MerkleTree from "merkletreejs";
import { getPostTransferBalance } from "./balances";
import { BitBadgesUserInfo, ClaimItem, DistributionMethod, IdRange, Transfers, UserBalance } from "./types";
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
        for (const addressString of claimItem.addresses) {

            const res = addressString.split('-');
            const amount = Number(res[0]);
            const address = res[1];

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

export const getClaimsValueFromClaimItems = (balance: UserBalance, claimItems: ClaimItem[], distributionMethod: DistributionMethod) => {
    balance = JSON.parse(JSON.stringify(balance));
    const claimBalance = JSON.parse(JSON.stringify(balance));

    const tree = new MerkleTree(claimItems.map((x) => SHA256(x.fullCode)), SHA256)
    const root = tree.getRoot().toString('hex')

    if (distributionMethod === DistributionMethod.Codes) {
        for (let i = 0; i < claimItems.length; i += 2) {
            const leaf = claimItems[i];
            for (const badgeId of leaf.badgeIds) {
                const newBalance = getPostTransferBalance(balance, badgeId.start, badgeId.end, leaf.amount, 1);
                balance.balances = newBalance.balances;
            }
        }
    } else if (distributionMethod === DistributionMethod.Whitelist) {
        for (let i = 0; i < claimItems.length; i++) {
            const leaf = claimItems[i];
            for (const badgeId of leaf.badgeIds) {
                const newBalance = getPostTransferBalance(balance, badgeId.start, badgeId.end, leaf.amount, 1);
                balance.balances = newBalance.balances;
            }
        }
    }

    for (const balanceObj of balance.balances) {
        for (const badgeId of balanceObj.badgeIds) {
            const newBalance = getPostTransferBalance(claimBalance, badgeId.start, badgeId.end, balanceObj.balance, 1);
            claimBalance.balances = newBalance.balances;
        }
    }

    return {
        claimBalance,
        balance,
        claims: [
            {

                balances: claimBalance.balances,
                uri: "",
                dataRoot: root,
                timeRange: {
                    start: 0,
                    end: GO_MAX_UINT_64
                },
            }
        ],
    }
}