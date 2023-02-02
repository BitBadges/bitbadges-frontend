import { ClaimItem, IdRange } from "./types";

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
    }

    return currLeaf;
}

export function createClaim(code: string, address: string, amount: number, badgeIds: IdRange[], accountNum: number): ClaimItem {
    return {
        code,
        address,
        amount,
        badgeIds,
        fullCode: `${code}-${address}-${amount}-${badgeIds[0].start}-${badgeIds[0].end}`,
        accountNum
    }
}