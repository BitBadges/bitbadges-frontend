import MerkleTree from "merkletreejs";
import { getPostTransferBalance } from "./balances";
import { BitBadgesUserInfo, ClaimItem, DistributionMethod, IdRange, UserBalance } from "./types";
import { SHA256 } from "crypto-js";

//Claims will have the format "CODE-ADDRESS-AMOUNT-STARTID-ENDID"

export function parseClaim(fullClaimString: string): ClaimItem {
    const currLeaf: ClaimItem = {
        code: fullClaimString.split('-')[0],
        address: fullClaimString.split('-')[1],
        amount: Number(fullClaimString.split('-')[2]),
        badgeIds: [{
            start: Number(fullClaimString.split('-')[3]),
            end: Number(fullClaimString.split('-')[4]),
        }],
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
    return {
        code,
        address,
        amount,
        badgeIds,
        fullCode: `${code}-${address}-${amount}-${badgeIds[0].start}-${badgeIds[0].end}`,
        accountNum,
        userInfo: currUserInfo,
    }
}

export const getClaimsValueFromClaimItems = (balance: UserBalance, claimItems: ClaimItem[], distributionMethod: DistributionMethod) => {
    balance = JSON.parse(JSON.stringify(balance));
    const claimBalance = JSON.parse(JSON.stringify(balance));

    const tree = new MerkleTree(claimItems.map((x) => SHA256(x.fullCode)), SHA256)
    const root = tree.getRoot().toString('hex')

    if (distributionMethod === DistributionMethod.Codes) {
        for (let i = 0; i < claimItems.length; i += 2) {
            const leaf = claimItems[i];
            const newBalance = getPostTransferBalance(balance, leaf.badgeIds[0].start, leaf.badgeIds[0].end, leaf.amount, 1);
            balance.balances = newBalance.balances;
        }
    } else if (distributionMethod === DistributionMethod.Whitelist) {
        for (let i = 0; i < claimItems.length; i++) {
            const leaf = claimItems[i];
            const newBalance = getPostTransferBalance(balance, leaf.badgeIds[0].start, leaf.badgeIds[0].end, leaf.amount, 1);
            balance.balances = newBalance.balances;
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
                    end: Number.MAX_SAFE_INTEGER //TODO: change to max uint64,
                },
                incrementIdsBy: 0,
                badgeIds: [],
            }
        ]
    }
}