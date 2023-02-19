import { BitBadgesUserInfo, CosmosAccountInformation } from "./types";

export function convertToBitBadgesUserInfo(
    accountInfo: CosmosAccountInformation
): BitBadgesUserInfo {
    return {
        accountNumber: accountInfo.account_number,
        address: accountInfo.address,
        cosmosAddress: accountInfo.cosmosAddress,
        chain: accountInfo.chain
    };
}