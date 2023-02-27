import MerkleTree from "merkletreejs";
import { getPostTransferBalance } from "./balances";
import { BitBadgesUserInfo, ClaimItem, DistributionMethod, IdRange, UserBalance } from "./types";
import { SHA256 } from "crypto-js";
import { GO_MAX_UINT_64 } from "../constants";

//Claims will have the format "CODE-ADDRESS-AMOUNT-STARTID-ENDID-STARTID-ENDID..."

export function parseClaim(fullClaimString: string): ClaimItem {
    const values = fullClaimString.split('-');
    const badgeIds = [];
    for (let i = 3; i < values.length; i += 2) {
        badgeIds.push({
            start: Number(values[i]),
            end: Number(values[i + 1]),
        })
    }

    const currLeaf: ClaimItem = {
        code: values[0],
        address: values[1],
        amount: Number(values[2]),
        badgeIds: badgeIds,
        fullCode: fullClaimString,
        accountNum: -1,
        userInfo: {
            address: '',
            cosmosAddress: '',
            accountNumber: -1,
            chain: '',
        }
    }

    return currLeaf;
}

export function createClaim(code: string, address: string, amount: number, badgeIds: IdRange[], accountNum: number, currUserInfo: BitBadgesUserInfo): ClaimItem {
    let fullCode = `${code}-${address}-${amount}`
    for (const badgeId of badgeIds) {
        fullCode += `-${badgeId.start}-${badgeId.end}`
    }

    return {
        code,
        address,
        amount,
        badgeIds,
        fullCode: fullCode,
        accountNum,
        userInfo: currUserInfo,
    }
}

export const getTransfersFromClaimItems = (claimItems: ClaimItem[]) => {
    return claimItems.map((x) => ({
        toAddresses: [x.accountNum],
        balances: [
            {
                balance: x.amount,
                badgeIds: x.badgeIds,
            }
        ]
    }));
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
                amountPerClaim: 0,
                balances: claimBalance.balances,
                type: 0,
                uri: "",
                data: root,
                timeRange: {
                    start: 0,
                    end: GO_MAX_UINT_64
                },
                incrementIdsBy: 0,
                badgeIds: [],
            }
        ]
    }
}