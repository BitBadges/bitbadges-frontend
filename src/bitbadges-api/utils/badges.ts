import { UintRange } from "bitbadgesjs-sdk"
import { BitBadgesCollection, invertUintRanges, removeUintRangesFromUintRanges, searchUintRangesForId, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-sdk"

import { GO_MAX_UINT_64 } from "../../utils/dates"
import { getDetailsForCollectionPermission } from "./permissions"

const getForbiddenBadgeIds = (details: ReturnType<typeof getDetailsForCollectionPermission>, mode: 'current' | 'always') => {
  const dataSource = details.dataSource.filter(x => {
    if (mode == 'always') return true

    //else, filter out only the ones that correpsond to the current time
    const [_, found] = searchUintRangesForId(BigInt(Date.now()), x.badgeIds ?? [])
    return found
  })

  const forbiddenBadgeIds = sortUintRangesAndMergeIfNecessary(
    dataSource.map((x) => (x.forbidden ? x.badgeIds : undefined)).filter((x) => x !== undefined).flat() as UintRange<bigint>[],
    true
  )

  const permittedBadgeIds = sortUintRangesAndMergeIfNecessary(
    dataSource.map((x) => (!x.forbidden ? x.badgeIds : undefined)).filter((x) => x !== undefined).flat() as UintRange<bigint>[],
    true
  )

  //always forbidden badge IDs are those that are forbidden in all cases (i.e. have no neutral or permitted times for any criteria)

  //remove the permitted ones from the forbidden ones....what is left over is always forbidden
  const [remaining, _removed] = removeUintRangesFromUintRanges(permittedBadgeIds, forbiddenBadgeIds)
  const alwaysForbiddenBadgeIds = remaining
  return alwaysForbiddenBadgeIds
}


//These are just at this moment? For BadgesTab query?
export const getBadgesWithFrozenMetadata = (collection: BitBadgesCollection<bigint>, mode: 'current' | 'always') => {
  const canUpdateRes = getDetailsForCollectionPermission(collection, "canUpdateBadgeMetadata");
  const lockedBadgeIds = getForbiddenBadgeIds(canUpdateRes, mode)
  return lockedBadgeIds
}

export const getBadgesWithFrozenTransferability = (
  collection: BitBadgesCollection<bigint>, mode: 'current' | 'always'
) => {
  const canTransferRes = getDetailsForCollectionPermission(collection, "canUpdateCollectionApprovals");
  const lockedBadgeIds = getForbiddenBadgeIds(canTransferRes, mode)
  return lockedBadgeIds
}


//This is in the future
export const getBadgesWithLockedSupply = (
  collection: BitBadgesCollection<bigint>,
  startingCollection: BitBadgesCollection<bigint> | undefined,
  currentCollection = false,
  mode: 'current' | 'always'
) => {
  const collectionToCheck = currentCollection ? collection : startingCollection
  if (!collectionToCheck) return []

  const canCreateMoreBadgesRes = getDetailsForCollectionPermission(collectionToCheck, "canCreateMoreBadges");
  const lockedBadgeIds = getForbiddenBadgeIds(canCreateMoreBadgesRes, mode)
  return lockedBadgeIds
}

export const getBadgesWithUnlockedSupply = (
  collection: BitBadgesCollection<bigint>,
  startingCollection: BitBadgesCollection<bigint> | undefined,
  currentCollection = false,
  mode: 'current' | 'always'
) => {
  return invertUintRanges(
    getBadgesWithLockedSupply(
      collection,
      startingCollection,
      currentCollection,
      mode
    ),
    1n,
    GO_MAX_UINT_64
  )
}


export const getBadgesWithUpdatableMetadata = (
  collection: BitBadgesCollection<bigint>,
  startingCollection: BitBadgesCollection<bigint> | undefined,
  currentCollection = false,
  mode: 'current' | 'always'
) => {
  const collectionToCheck = currentCollection ? collection : startingCollection
  if (!collectionToCheck) return []

  const canUpdateBadgeMetadataRes = getDetailsForCollectionPermission(collectionToCheck, "canUpdateBadgeMetadata");
  const lockedBadges = getForbiddenBadgeIds(canUpdateBadgeMetadataRes, mode)
  return invertUintRanges(lockedBadges, 1n, GO_MAX_UINT_64)
}
