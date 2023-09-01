import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanUpdateBalancesStepItem(

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
                message: `The balances are permanently frozen and can never be updated.`,
                isSelected:  collection?.collectionPermissions.canUpdateOffChainBalancesMetadata.length > 0
              },
              {
                title: 'Yes',
                message: `The balances can be updated by the manager.`,
                isSelected:  collection?.collectionPermissions.canUpdateOffChainBalancesMetadata.length === 0,
              },
            ]}
            onSwitchChange={(idx) => {
              collections.updateCollection({
                ...collection,
                collectionPermissions: {
                  ...collection.collectionPermissions,
                  canUpdateOffChainBalancesMetadata: idx === 0 ? [{
                    defaultValues: {
                      timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                      permittedTimes: [],
                      forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                    },
                    combinations: [{
                      // permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      // forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      // timelineTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                    }]
                  }] : []
                }
              });
            }}

          />
        }
      />,
    disabled:  !!err,
  }
}