import { BitBadgesCollection, UintRange, UintRangeArray, iUintRange } from 'bitbadgesjs-sdk';

import { getDetailsForCollectionPermission } from './permissions';

const getForbiddenBadgeIds = (details: ReturnType<typeof getDetailsForCollectionPermission>, mode: 'current' | 'always') => {
  const dataSource = details.dataSource.filter((x) => {
    if (mode == 'always') return true;
    return x.badgeIds.searchIfExists(BigInt(Date.now()));
  });

  const forbiddenBadgeIds = UintRangeArray.From(
    dataSource
      .map((x) => (x.forbidden ? x.badgeIds : undefined))
      .filter((x) => x !== undefined)
      .flat() as Array<iUintRange<bigint>>
  ).sortAndMerge();
  const permittedBadgeIds = UintRangeArray.From(
    dataSource
      .map((x) => (!x.forbidden ? x.badgeIds : undefined))
      .filter((x) => x !== undefined)
      .flat() as Array<iUintRange<bigint>>
  ).sortAndMerge();

  //always forbidden badge IDs are those that are forbidden in all cases (i.e. have no neutral or permitted times for any criteria)

  //remove the permitted ones from the forbidden ones....what is left over is always forbidden
  forbiddenBadgeIds.remove(permittedBadgeIds);
  return forbiddenBadgeIds;
};

//These are just at this moment? For BadgesTab query?
export const getBadgesWithFrozenMetadata = (collection: Readonly<BitBadgesCollection<bigint>>, mode: 'current' | 'always') => {
  const canUpdateRes = getDetailsForCollectionPermission(collection, 'canUpdateBadgeMetadata');
  const lockedBadgeIds = getForbiddenBadgeIds(canUpdateRes, mode);
  return lockedBadgeIds;
};

export const getBadgesWithFrozenTransferability = (collection: Readonly<BitBadgesCollection<bigint>>, mode: 'current' | 'always') => {
  const canTransferRes = getDetailsForCollectionPermission(collection, 'canUpdateCollectionApprovals');
  const lockedBadgeIds = getForbiddenBadgeIds(canTransferRes, mode);
  return lockedBadgeIds;
};

//This is in the future
export const getBadgesWithLockedSupply = (
  collection: Readonly<BitBadgesCollection<bigint>>,
  startingCollection: Readonly<BitBadgesCollection<bigint>> | undefined,
  currentCollection = false,
  mode: 'current' | 'always'
) => {
  const collectionToCheck = currentCollection ? collection : startingCollection;
  if (!collectionToCheck) return new UintRangeArray<bigint>();

  const canCreateMoreBadgesRes = getDetailsForCollectionPermission(collectionToCheck, 'canCreateMoreBadges');
  const lockedBadgeIds = getForbiddenBadgeIds(canCreateMoreBadgesRes, mode);
  return lockedBadgeIds;
};

export const getBadgesWithUnlockedSupply = (
  collection: Readonly<BitBadgesCollection<bigint>>,
  startingCollection: Readonly<BitBadgesCollection<bigint>> | undefined,
  currentCollection = false,
  mode: 'current' | 'always'
) => {
  return getBadgesWithLockedSupply(collection, startingCollection, currentCollection, mode).toInverted(UintRange.FullRange());
};

export const getBadgesWithUpdatableMetadata = (
  collection: Readonly<BitBadgesCollection<bigint>>,
  startingCollection: Readonly<BitBadgesCollection<bigint>> | undefined,
  currentCollection = false,
  mode: 'current' | 'always'
) => {
  const collectionToCheck = currentCollection ? collection : startingCollection;
  if (!collectionToCheck) return new UintRangeArray<bigint>();

  const canUpdateBadgeMetadataRes = getDetailsForCollectionPermission(collectionToCheck, 'canUpdateBadgeMetadata');
  return getForbiddenBadgeIds(canUpdateBadgeMetadataRes, mode).toInverted(UintRange.FullRange());
};
