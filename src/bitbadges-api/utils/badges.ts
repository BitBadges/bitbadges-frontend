import { BitBadgesCollection } from "bitbadgesjs-utils";

export function getTotalNumberOfBadges(collection: BitBadgesCollection<bigint>) {
  const totalSupplyBalance = collection?.owners.find(x => x.cosmosAddress === 'Total')?.balances ?? [];

  let maxBadgeId = 0n;
  for (const balance of totalSupplyBalance) {
    for (const badgeIdRange of balance.badgeIds) {
      if (badgeIdRange.end > maxBadgeId) {
        maxBadgeId = badgeIdRange.end;
      }
    }
  }
  return maxBadgeId;
}