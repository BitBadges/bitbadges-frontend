import { BitBadgesCollection } from "bitbadgesjs-sdk";

export const areBalancesBitBadgesHosted = (collection?: BitBadgesCollection<bigint>) => {
  return collection && collection.offChainBalancesMetadataTimeline.length > 0 &&
    collection.balancesType == "Off-Chain - Indexed" &&
    collection?.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri.startsWith('https://bitbadges-balances.nyc3.digitaloceanspaces.com/balances/');
}

