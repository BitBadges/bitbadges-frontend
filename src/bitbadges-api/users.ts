import { BitBadgesUserInfo, CosmosAccountInformation } from "./types";

export function convertToBitBadgesUserInfo(
    accountInfo: CosmosAccountInformation
): BitBadgesUserInfo {
    return {
        accountNumber: accountInfo.account_number ? accountInfo.account_number : -1,
        address: accountInfo.address,
        cosmosAddress: accountInfo.cosmosAddress,
        chain: accountInfo.chain,
        name: accountInfo.name
    };
}