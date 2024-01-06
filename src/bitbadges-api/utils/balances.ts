import { Balance, deepCopy } from "bitbadgesjs-proto";
import { BitBadgesCollection } from "bitbadgesjs-utils";

export const areBalancesBitBadgesHosted = (collection?: BitBadgesCollection<bigint>) => {
  return collection && collection.offChainBalancesMetadataTimeline.length > 0 &&
    collection.balancesType == "Off-Chain - Indexed" &&
    collection?.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri.startsWith('https://bitbadges-balances.nyc3.digitaloceanspaces.com/balances/');
}

export const applyIncrementsToBalances = (
  startBalances: Balance<bigint>[],
  incrementBadgeIdsBy: bigint,
  incrementOwnershipTimesBy: bigint,
  numIncrements: bigint,
) => {
  let balancesToReturn = deepCopy(startBalances)
  balancesToReturn = startBalances.map((x) => {
    return {
      ...x,
      badgeIds: x.badgeIds.map((y) => {
        return {
          start: y.start + incrementBadgeIdsBy * BigInt(numIncrements),
          end: y.end + incrementBadgeIdsBy * BigInt(numIncrements),
        }
      }),
      ownershipTimes: x.ownershipTimes.map((y) => {
        return {
          start: y.start + incrementOwnershipTimesBy * BigInt(numIncrements),
          end: y.end + incrementOwnershipTimesBy * BigInt(numIncrements),
        }
      }),
    }
  })


  return balancesToReturn
}