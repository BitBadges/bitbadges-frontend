import { BalancesActionPermission } from "bitbadgesjs-proto";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { compareObjects } from "../../../utils/compare";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { DevMode } from "../../common/DevMode";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

//TODO: Differentiate between always permitted and permitted but updatable
//TODO: What if they custom implemented a permission
//TODO: Advanced option

const DefaultCombinations = [{
  // badgeIdsOptions: { invertDefault: false, allValues: false, noValues: false },
  // ownershipTimesOptions: { invertDefault: false, allValues: false, noValues: false },
  // permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
  // forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
}]

export const AlwaysLockedPermission: BalancesActionPermission<bigint> = {
  defaultValues: {
    badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
    ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    permittedTimes: [],
    forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
  },
  combinations: DefaultCombinations
}

export function CanCreateMoreStepItem(

  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [checked, setChecked] = useState<boolean>(true);
  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem;

  const maxBadgeId = getTotalNumberOfBadges(collection);


  return {
    title: 'Can Add Badges?',
    description: `Moving forward, can the manager create more badges?`,
    node: <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName="canCreateMoreBadges"
      existingCollectionId={existingCollectionId}
      node={<>
        <SwitchForm
          // noSelectUntilClick
          options={[
            {
              title: 'No',
              message: `New badges can never be added to this collection. The circulating supplys will all be final after this transaction.`,
              isSelected: compareObjects(collection.collectionPermissions.canCreateMoreBadges, [AlwaysLockedPermission]),
            },
            {
              title: 'Unique Badges Only',
              message: `In the future, new unique badges (i.e. badges with new IDs) can be added, but any existing badge's supply can never be increased.`,
              isSelected: !compareObjects(collection.collectionPermissions.canCreateMoreBadges, [AlwaysLockedPermission])
                && !compareObjects(collection.collectionPermissions.canCreateMoreBadges, [])
                && collection.collectionPermissions.canCreateMoreBadges[0].defaultValues.badgeIds[0].start === 1n
            },
            {
              title: 'Increment Supply Only',
              message: `In the future, the supply of existing badges can be increased, but no new unique badges (i.e. badges with new IDs) can ever be created.`,
              isSelected: !compareObjects(collection.collectionPermissions.canCreateMoreBadges, [AlwaysLockedPermission])
                && !compareObjects(collection.collectionPermissions.canCreateMoreBadges, [])
                && collection.collectionPermissions.canCreateMoreBadges[0].defaultValues.badgeIds[0].start === maxBadgeId + 1n
            },
            {
              title: 'Any',
              message: `In the future, new unique badges (i.e. badges with new IDs) can be added, and the supply of existing badges can be increased.`,
              isSelected: compareObjects(collection.collectionPermissions.canCreateMoreBadges, []),
            },
          ]}
          onSwitchChange={(idx) => {
            const permissions = idx === 0 ? [AlwaysLockedPermission] :
              idx === 1 ? [{
                defaultValues: {
                  ...AlwaysLockedPermission.defaultValues,
                  badgeIds: [{ start: 1n, end: maxBadgeId }],
                },
                combinations: DefaultCombinations
              }] : idx === 2 ? [{
                defaultValues: {
                  ...AlwaysLockedPermission.defaultValues,
                  badgeIds: [{ start: maxBadgeId + 1n, end: GO_MAX_UINT_64 }],
                },
                combinations: DefaultCombinations
              }] : [];

            collections.updateCollection({
              ...collection,
              collectionPermissions: {
                ...collection.collectionPermissions,
                canCreateMoreBadges: permissions
              }
            });
          }}
          helperMessage=""
        />
        <DevMode obj={collection.collectionPermissions.canCreateMoreBadges} />
      </>
      }
    />,
    disabled: !!err,
  }
}