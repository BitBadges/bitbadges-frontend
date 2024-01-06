import { Divider } from "antd"
import { BalancesActionPermission } from "bitbadgesjs-proto"
import { useCallback, useState } from "react"

import { getMaxBadgeIdForCollection } from "bitbadgesjs-utils"
import {
  EmptyStepItem,
  NEW_COLLECTION_ID,
} from "../../../bitbadges-api/contexts/TxTimelineContext"
import {
  updateCollection,
  useCollection
} from "../../../bitbadges-api/contexts/collections/CollectionsContext"
import { getDetailsForCollectionPermission } from "../../../bitbadges-api/utils/permissions"
import { GO_MAX_UINT_64 } from "../../../utils/dates"
import {
  PermissionsOverview
} from "../../collection-page/PermissionsInfo"
import { DevMode } from "../../common/DevMode"
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper"
import { SwitchForm } from "../form-items/SwitchForm"

const EverythingElsePermanentlyPermittedPermission: BalancesActionPermission<bigint> =
{
  badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
  ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
  permittedTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
  forbiddenTimes: [],
}

const AlwaysLockedPermission: BalancesActionPermission<bigint> = {
  badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
  ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
  permittedTimes: [],
  forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
}

export function CanCreateMoreStepItem() {
  const collection = useCollection(NEW_COLLECTION_ID)

  const [checked, setChecked] = useState<boolean>(true)
  const [err, setErr] = useState<Error | null>(null)

  const maxBadgeId = collection ? getMaxBadgeIdForCollection(collection) : 0n

  const handleSwitchChange = useCallback(
    (idx: number, locked: boolean) => {
      const permissions =
        idx >= 0 && idx <= 2
          ? [
            {
              ...AlwaysLockedPermission,
              badgeIds:
                idx == 0
                  ? AlwaysLockedPermission.badgeIds
                  : idx == 1
                    ? [{ start: 1n, end: maxBadgeId }]
                    : [{ start: maxBadgeId + 1n, end: GO_MAX_UINT_64 }],
            },
          ]
          : []

      if (locked) {
        permissions.push(EverythingElsePermanentlyPermittedPermission)
      }

      updateCollection({
        collectionId: NEW_COLLECTION_ID,
        collectionPermissions: {
          canCreateMoreBadges: permissions,
        },
      })
    },
    [maxBadgeId]
  )

  if (!collection) return EmptyStepItem


  const permissionDetails = getDetailsForCollectionPermission(collection, "canCreateMoreBadges")
  const currentlyMintedPermissionDetails = getDetailsForCollectionPermission(collection, "canCreateMoreBadges", [{ start: 1n, end: maxBadgeId }])
  const allUnmintedPermissionDetails = getDetailsForCollectionPermission(collection, "canCreateMoreBadges", [{ start: maxBadgeId + 1n, end: GO_MAX_UINT_64 }])

  const AdditionalNode = () => {
    return (
      <>
        <div className="flex-center">
          <PermissionsOverview
            span={24}
            collectionId={collection.collectionId}
            permissionName="canCreateMoreBadges"
            onFreezePermitted={(frozen: boolean) => {
              handleSwitchChange(selectedIdx, frozen)
            }}
          />
        </div>
      </>
    )
  }

  const completelyFrozen = permissionDetails.isAlwaysFrozenAndForbidden

  const selectedIdx = completelyFrozen ? 0
    : currentlyMintedPermissionDetails.isAlwaysFrozenAndForbidden &&
      allUnmintedPermissionDetails.isAlwaysPermittedOrNeutral
      ? 1
      : allUnmintedPermissionDetails.isAlwaysFrozenAndForbidden &&
        currentlyMintedPermissionDetails.isAlwaysPermittedOrNeutral
        ? 2
        : permissionDetails.isAlwaysPermittedOrNeutral
          ? 3
          : -1

  return {
    title: "Can create more badges?",
    description: `Can new badges be created and added to this collection by the manager in the future?`,
    node: () => (
      <PermissionUpdateSelectWrapper
        checked={checked}
        setChecked={setChecked}
        err={err}
        setErr={setErr}
        permissionName="canCreateMoreBadges"
        node={() => (
          <>
            <SwitchForm
              showCustomOption
              options={[
                {
                  title: "No",
                  message: `New badges can never be added to this collection. The circulating supplys will all be final after this transaction.`,
                  isSelected: completelyFrozen,
                  additionalNode: () => <AdditionalNode />,
                },
                {
                  title: "Unique Badges Only",
                  message: `In the future, new unique badges (i.e. badges with new IDs) can be added, but any existing badge's supply can never be increased.`,
                  //all are forbidden explicitly for the currently minted badges
                  isSelected:
                    !completelyFrozen &&
                    currentlyMintedPermissionDetails.isAlwaysFrozenAndForbidden &&
                    allUnmintedPermissionDetails.isAlwaysPermittedOrNeutral,
                  additionalNode: () => <AdditionalNode />,
                },
                {
                  title: "Increment Supply Only",
                  message: `In the future, the supply of existing badges can be increased, but no new unique badges (i.e. badges with new IDs) can ever be created.`,
                  //all are forbidden explicitly for all future badges
                  isSelected:
                    !completelyFrozen &&
                    allUnmintedPermissionDetails.isAlwaysFrozenAndForbidden &&
                    currentlyMintedPermissionDetails.isAlwaysPermittedOrNeutral,
                  additionalNode: () => <AdditionalNode />,
                },
                {
                  title: "Any",
                  message: `In the future, new unique badges (i.e. badges with new IDs) can be added, and the supply of existing badges can be increased.`,
                  isSelected:
                    permissionDetails.isAlwaysPermittedOrNeutral,
                  additionalNode: () => <AdditionalNode />,
                },
              ]}
              onSwitchChange={(idx) => {
                handleSwitchChange(idx, false)
              }}
              helperMessage=""
            />
            <Divider />

            <DevMode
              obj={collection.collectionPermissions.canCreateMoreBadges}
            />
          </>
        )}
      />
    ),
    disabled: !!err,
  }
}
