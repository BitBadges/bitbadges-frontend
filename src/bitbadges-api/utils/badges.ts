import { UintRange } from "bitbadgesjs-proto";
import { BitBadgesCollection } from "bitbadgesjs-utils";

export function getTotalNumberOfBadges(collection: BitBadgesCollection<bigint>) {
  const totalSupplyBalance = collection?.owners.find(x => x.cosmosAddress === 'Total')?.balances ?? [];
  const defaultBalances = collection.defaultBalances.balances ?? [];

  let maxBadgeId = 0n;
  for (const balance of totalSupplyBalance) {
    for (const badgeIdRange of balance.badgeIds) {
      if (badgeIdRange.end > maxBadgeId) {
        maxBadgeId = badgeIdRange.end;
      }
    }
  }

  for (const balance of defaultBalances) {
    for (const badgeIdRange of balance.badgeIds) {
      if (badgeIdRange.end > maxBadgeId) {
        maxBadgeId = badgeIdRange.end;
      }
    }
  }

  return maxBadgeId;
}

export const getTotalNumberOfBadgeIds = (badgeIds: UintRange<bigint>[]) => {
  let sum = 0n;
  for (const range of badgeIds) {
    sum += range.end - range.start + 1n;
  }

  return sum;
}
