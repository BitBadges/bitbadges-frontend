import { UintRange } from "bitbadgesjs-proto";
import { removeUintRangeFromUintRange, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";

export interface BatchBadgeDetails {
  collectionId: bigint
  badgeIds: UintRange<bigint>[]
}

export const inBatchArray = (arr: BatchBadgeDetails[], badgeIdObj: BatchBadgeDetails) => {
  return !!arr.find(x => {
    if (x.badgeIds.length == 0) return false;

    const [remaining] = removeUintRangeFromUintRange(x.badgeIds, badgeIdObj.badgeIds);
    return x.collectionId == badgeIdObj.collectionId && remaining.length == 0
  });
}

export const addToBatchArray = (
  arr: BatchBadgeDetails[],
  badgeIdObjsToAdd: BatchBadgeDetails[]
) => {
  for (const badgeIdObj of badgeIdObjsToAdd) {
    const badgeIdsToAdd = badgeIdObj.badgeIds
    const existingIdx = arr.findIndex(
      (x) => x.collectionId == badgeIdObj.collectionId
    )
    if (existingIdx != -1) {
      arr[existingIdx].badgeIds = sortUintRangesAndMergeIfNecessary(
        [...arr[existingIdx].badgeIds, ...badgeIdsToAdd],
        true
      )
    } else {
      arr.push({
        collectionId: badgeIdObj.collectionId,
        badgeIds: badgeIdsToAdd,
      })
    }
  }

  return arr.filter((x) => x.badgeIds.length > 0)
}

export const removeFromBatchArray = (
  arr: BatchBadgeDetails[],
  badgeIdObjsToRemove: BatchBadgeDetails[]
) => {
  for (const badgeIdObj of badgeIdObjsToRemove) {
    const badgeIdsToRemove = badgeIdObj.badgeIds

    const existingIdx = arr.findIndex(
      (x) => x.collectionId == badgeIdObj.collectionId
    )
    if (existingIdx != -1) {
      const [remaining] = removeUintRangeFromUintRange(
        badgeIdsToRemove,
        arr[existingIdx].badgeIds
      )
      arr[existingIdx].badgeIds = remaining
    }
  }

  return arr.filter((x) => x.badgeIds.length > 0)
}
