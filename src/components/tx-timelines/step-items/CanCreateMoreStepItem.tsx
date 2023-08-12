import { BalancesActionPermission, CollectionPermissions } from "bitbadgesjs-proto";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { FOREVER_DATE } from "../../../utils/dates";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { useState } from "react";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";

//TODO: Differentiate between always permitted and permitted but updatable
//TODO: What if they custom implemented a permission
//TODO: Advanced option

const DefaultCombinations = [{
  badgeIdsOptions: { invertDefault: false, allValues: false, noValues: false },
  ownershipTimesOptions: { invertDefault: false, allValues: false, noValues: false },
  permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
  forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
}]

const AlwaysLockedPermission: BalancesActionPermission<bigint> = {
  defaultValues: {
    badgeIds: [{ start: 1n, end: FOREVER_DATE }],
    ownershipTimes: [{ start: 1n, end: FOREVER_DATE }],
    permittedTimes: [],
    forbiddenTimes: [{ start: 1n, end: FOREVER_DATE }],
  },
  combinations: DefaultCombinations
}

export function CanCreateMoreStepItem(
  handledPermissions: CollectionPermissions<bigint>,
  setHandledPermissions: (permissions: CollectionPermissions<bigint>) => void,
  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
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
      node={
        <SwitchForm
          noSelectUntilClick
          options={[
            {
              title: 'No',
              message: `New badges can never be added to this collection. The circulating supplys will all be final after this transaction.`,
              isSelected: selectedIdx === 0
            },
            {
              title: 'Unique Badges Only',
              message: `In the future, new unique badges (i.e. badges with new IDs) can be added, but any existing badge's supply can never be increased.`,
              isSelected: selectedIdx === 1,
            },
            {
              title: 'Increment Supply Only',
              message: `In the future, the supply of existing badges can be increased, but no new unique badges (i.e. badges with new IDs) can ever be created.`,
              isSelected: selectedIdx === 2,
            },
            {
              title: 'Any',
              message: `In the future, new unique badges (i.e. badges with new IDs) can be added, and the supply of existing badges can be increased.`,
              isSelected: selectedIdx === 3,
            },
          ]}
          onSwitchChange={(idx) => {
            setHandledPermissions({
              ...handledPermissions,
              canCreateMoreBadges: [{} as BalancesActionPermission<bigint>]
            });

            setSelectedIdx(idx);

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
                  badgeIds: [{ start: maxBadgeId + 1n, end: FOREVER_DATE }],
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
      }
    />,
    disabled: handledPermissions.canCreateMoreBadges.length == 0 || !!err,
  }
}