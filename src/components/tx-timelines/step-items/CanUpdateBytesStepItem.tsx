import { CollectionPermissions, TimedUpdatePermission } from "bitbadgesjs-proto";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { FOREVER_DATE } from "../../../utils/dates";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { useState } from "react";

export function CanUpdateBalancesStepItem(
  handledPermissions: CollectionPermissions<bigint>,
  setHandledPermissions: (permissions: CollectionPermissions<bigint>) => void,
  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [checked, setChecked] = useState<boolean>(true);

  const [err, setErr] = useState<Error | null>(null);
  if (!collection) return EmptyStepItem;


  return {
    title: 'Can Update Balances?',
    description: ``,
    node:
      <PermissionUpdateSelectWrapper
        checked={checked}
        setChecked={setChecked}
        err={err}
        setErr={setErr}
        permissionName="canUpdateOffChainBalancesMetadata"
        existingCollectionId={existingCollectionId}
        node={
          <SwitchForm
            options={[
              {
                title: 'No',
                message: `The balances (who owns the badge?) are permanent and can never be updated.`,
                isSelected: handledPermissions.canUpdateOffChainBalancesMetadata.length > 0 && collection?.collectionPermissions.canUpdateOffChainBalancesMetadata.length > 0
              },
              {
                title: 'Yes',
                message: `The balances (who owns the badge?) can be updated by the manager.`,
                isSelected: handledPermissions.canUpdateOffChainBalancesMetadata.length > 0 && collection?.collectionPermissions.canUpdateOffChainBalancesMetadata.length === 0,
              },
            ]}
            onSwitchChange={(idx) => {
              setHandledPermissions({
                ...handledPermissions,
                canUpdateOffChainBalancesMetadata: [{} as TimedUpdatePermission<bigint>]
              });

              collections.updateCollection({
                ...collection,
                collectionPermissions: {
                  ...collection.collectionPermissions,
                  canUpdateOffChainBalancesMetadata: idx === 0 ? [{
                    defaultValues: {
                      timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
                      permittedTimes: [],
                      forbiddenTimes: [{ start: 1n, end: FOREVER_DATE }],
                    },
                    combinations: [{
                      permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      timelineTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                    }]
                  }] : []
                }
              });
            }}

          />
        }
      />,
    disabled: handledPermissions.canUpdateOffChainBalancesMetadata.length === 0 || !!err,
  }
}