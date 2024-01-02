import { UintRange, deepCopy } from "bitbadgesjs-proto"
import {
  ApprovalPermissionUsedFlags,
  BalancesActionPermissionUsedFlags,
  BitBadgesCollection,
  MetadataAddMethod,
  TimedUpdatePermissionUsedFlags,
  TimedUpdateWithBadgeIdsPermissionUsedFlags,
  castBalancesActionPermissionToUniversalPermission,
  castCollectionApprovalPermissionToUniversalPermission,
  castTimedUpdatePermissionToUniversalPermission,
  castTimedUpdateWithBadgeIdsPermissionToUniversalPermission,
  invertUintRanges,
  sortUintRangesAndMergeIfNecessary,
} from "bitbadgesjs-utils"
import { ReactNode, useState } from "react"

import {
  EmptyStepItem,
  NEW_COLLECTION_ID,
  useTxTimelineContext,
} from "../../../bitbadges-api/contexts/TxTimelineContext"
import {
  updateCollection,
  useCollection,
} from "../../../bitbadges-api/contexts/collections/CollectionsContext"
import { getMaxBadgeIdForCollection } from "bitbadgesjs-utils"
import { neverHasManager } from "../../../bitbadges-api/utils/manager"
import { GO_MAX_UINT_64 } from "../../../utils/dates"
import {
  PermissionsOverview,
  getPermissionDetails,
} from "../../collection-page/PermissionsInfo"
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper"
import { SwitchForm } from "../form-items/SwitchForm"
import {
  isCompletelyForbidden,
  isCompletelyNeutralOrCompletelyPermitted,
} from "./CanUpdateOffChainBalancesStepItem"

export const getBadgesWithFrozenMetadata = (
  collection: BitBadgesCollection<bigint>,
) => {

  const canUpdateRes = getPermissionDetails(
    collection
      ? castTimedUpdatePermissionToUniversalPermission(
        collection.collectionPermissions.canUpdateBadgeMetadata ?? []
      )
      : [],
    TimedUpdateWithBadgeIdsPermissionUsedFlags,
    neverHasManager(collection)
  )

  const lockedBadgeIds = sortUintRangesAndMergeIfNecessary(
    [
      ...(canUpdateRes.dataSource
        .map((x) => (x.forbidden ? x.badgeIds : undefined))
        .filter((x) => x !== undefined)
        .flat() as UintRange<bigint>[]),
    ],
    true
  )
  return lockedBadgeIds
}

export const getBadgesWithFrozenTransferability = (
  collection: BitBadgesCollection<bigint>,
) => {

  const canTransferRes = getPermissionDetails(
    collection
      ? castCollectionApprovalPermissionToUniversalPermission(
        collection.collectionPermissions.canUpdateCollectionApprovals ?? []
      )
      : [],
    ApprovalPermissionUsedFlags,
    neverHasManager(collection)
  )

  const lockedBadgeIds = sortUintRangesAndMergeIfNecessary(
    [
      ...(canTransferRes.dataSource
        .map((x) => (x.forbidden ? x.badgeIds : undefined))
        .filter((x) => x !== undefined)
        .flat() as UintRange<bigint>[]),
    ],
    true
  )
  return lockedBadgeIds
}

export const getBadgesWithLockedSupply = (
  collection: BitBadgesCollection<bigint>,
  startingCollection: BitBadgesCollection<bigint> | undefined,
  currentCollection = false
) => {
  const collectionToCheck = currentCollection ? collection : startingCollection
  if (!collectionToCheck) return []

  const canCreateMoreBadgesRes = getPermissionDetails(
    collectionToCheck
      ? castBalancesActionPermissionToUniversalPermission(
        collectionToCheck.collectionPermissions.canCreateMoreBadges ?? []
      )
      : [],
    BalancesActionPermissionUsedFlags,
    neverHasManager(collectionToCheck)
  )

  const lockedBadgeIds = sortUintRangesAndMergeIfNecessary(
    [
      ...(canCreateMoreBadgesRes.dataSource
        .map((x) => (x.forbidden ? x.badgeIds : undefined))
        .filter((x) => x !== undefined)
        .flat() as UintRange<bigint>[]),
    ],
    true
  )
  return lockedBadgeIds
}

export const getBadgesWithUnlockedSupply = (
  collection: BitBadgesCollection<bigint>,
  startingCollection: BitBadgesCollection<bigint> | undefined,
  currentCollection = false
) => {
  return invertUintRanges(
    getBadgesWithLockedSupply(
      collection,
      startingCollection,
      currentCollection
    ),
    1n,
    GO_MAX_UINT_64
  )
}

export function UpdatableMetadataSelectStepItem(
  collectionMetadataUpdate: boolean
) {
  const collection = useCollection(NEW_COLLECTION_ID)
  const [checked, setChecked] = useState<boolean>(true)

  const txTimelineContext = useTxTimelineContext()
  const addMethod = collectionMetadataUpdate
    ? txTimelineContext.collectionAddMethod
    : txTimelineContext.badgeAddMethod

  const [err, setErr] = useState<Error | null>(null)
  const maxBadgeId = collection ? getMaxBadgeIdForCollection(collection) : 0n

  const badgeIdsWithLockedSupply = getBadgesWithLockedSupply(
    deepCopy(collection) as BitBadgesCollection<bigint>,
    undefined,
    true
  ) //Get badge IDs that will have locked supply moving forward
  const badgeIdsToLockMetadata = sortUintRangesAndMergeIfNecessary(
    [{ start: 1n, end: maxBadgeId }, ...badgeIdsWithLockedSupply],
    true
  )

  if (!collection) return EmptyStepItem
  const permissionDetails = collectionMetadataUpdate
    ? getPermissionDetails(
      castTimedUpdatePermissionToUniversalPermission(
        collection?.collectionPermissions.canUpdateCollectionMetadata ?? []
      ),
      TimedUpdatePermissionUsedFlags,
      neverHasManager(collection)
    )
    : getPermissionDetails(
      castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(
        collection?.collectionPermissions.canUpdateBadgeMetadata ?? []
      ),
      TimedUpdateWithBadgeIdsPermissionUsedFlags,
      neverHasManager(collection),
      [{ start: 1n, end: maxBadgeId }]
    )

  function AdditionalNode({ noOption }: { noOption?: boolean }) {
    if (!collection) return <></>

    return (
      <div className="flex-center">
        <PermissionsOverview
          span={24}
          collectionId={collection.collectionId}
          permissionName={
            collectionMetadataUpdate
              ? "canUpdateCollectionMetadata"
              : "canUpdateBadgeMetadata"
          }
          onFreezePermitted={
            noOption
              ? undefined
              : (frozen: boolean) => {
                handleSwitchChange(1, frozen)
              }
          }
        />
      </div>
    )
  }

  const options: {
    title: string
    message: string | ReactNode
    isSelected: boolean
    additionalNode?: () => ReactNode
  }[] = []
  options.push({
    title: "No",
    message: `${addMethod === MetadataAddMethod.UploadUrl
      ? "The URIs for the metadata (i.e. the self-hosted ones provided by you)"
      : "The metadata"
      } will be frozen and cannot be updated after this transaction.`,
    isSelected: isCompletelyForbidden(permissionDetails),
    additionalNode: () => <AdditionalNode noOption />,
  })

  options.push({
    title: "Yes",
    message: (
      <div>{`${addMethod === MetadataAddMethod.UploadUrl
        ? "The URIs (i.e. the self-hosted URIs provided by you)"
        : "The metadata"
        } can be updated.
    `}</div>
    ),
    additionalNode: () => <AdditionalNode />,
    isSelected: isCompletelyNeutralOrCompletelyPermitted(permissionDetails),
  })

  const handleSwitchChangeIdxOnly = (idx: number) => {
    handleSwitchChange(idx)
  }

  const handleSwitchChange = (idx: number, frozen?: boolean) => {
    if (collectionMetadataUpdate) {
      if (idx == 1 && !frozen) {
        updateCollection({
          collectionId: NEW_COLLECTION_ID,
          collectionPermissions: {
            canUpdateCollectionMetadata: [],
          },
        })
      } else if (idx == 1 && frozen) {
        updateCollection({
          collectionId: NEW_COLLECTION_ID,
          collectionPermissions: {
            canUpdateCollectionMetadata: [
              {
                timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                permittedTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                forbiddenTimes: [],
              },
            ],
          },
        })
      } else {
        updateCollection({
          collectionId: NEW_COLLECTION_ID,
          collectionPermissions: {
            canUpdateCollectionMetadata: [
              {
                timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                permittedTimes: [],
                forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              },
            ],
          },
        })
      }
    } else {
      if (idx == 1 && !frozen) {
        updateCollection({
          collectionId: NEW_COLLECTION_ID,
          collectionPermissions: {
            canUpdateBadgeMetadata: [],
          },
        })
      } else if (idx == 1 && frozen) {
        updateCollection({
          collectionId: NEW_COLLECTION_ID,
          collectionPermissions: {
            canUpdateBadgeMetadata: [
              {
                badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
                timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                permittedTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                forbiddenTimes: [],
              },
            ],
          },
        })
      } else {
        updateCollection({
          collectionId: NEW_COLLECTION_ID,
          collectionPermissions: {
            canUpdateBadgeMetadata: [
              {
                badgeIds: badgeIdsToLockMetadata,
                timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                permittedTimes: [],
                forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              },
            ],
          },
        })
      }
    }
  }

  let description = `Following this transaction, do you want to be able to update the metadata for ${collectionMetadataUpdate ? "the collection" : "the created badges"
    }?`

  return {
    title: collectionMetadataUpdate
      ? "Update collection metadata?"
      : "Updatable badge metadata?",
    description: description,
    node: () => (
      <PermissionUpdateSelectWrapper
        checked={checked}
        setChecked={setChecked}
        err={err}
        setErr={setErr}
        permissionName={
          collectionMetadataUpdate
            ? "canUpdateCollectionMetadata"
            : "canUpdateBadgeMetadata"
        }
        node={() => (
          <>
            <SwitchForm
              options={options}
              showCustomOption
              onSwitchChange={handleSwitchChangeIdxOnly}
            />
          </>
        )}
      />
    ),
    disabled: !!err,
  }
}
