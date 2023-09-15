import { TimedUpdatePermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission } from "bitbadgesjs-utils";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { getPermissionDataSource } from "../../collection-page/PermissionsInfo";
import { BeforeAfterPermission } from "../form-items/BeforeAfterPermission";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanManagerBeTransferredStepItem(

  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;
  const [checked, setChecked] = useState<boolean>(true);

  const [err, setErr] = useState<Error | null>(null);
  if (!collection) return EmptyStepItem;
  // const permissionDetails = getPermissionDataSource(castBalancesActionPermissionToUniversalPermission(collection?.collectionPermissions.canCreateMoreBadges ?? []), BalancesActionPermissionUsedFlags);
  const permissionDetails = getPermissionDataSource(castTimedUpdatePermissionToUniversalPermission(collection?.collectionPermissions.canUpdateManager ?? []), TimedUpdatePermissionUsedFlags);

  return {
    title: 'Transferable Manager Role?',
    description: ``,
    node: <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName="canUpdateManager"
      existingCollectionId={existingCollectionId}
      node={<>
        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'No',
              message: `The role of the manager cannot be transferred to another address.`,
              isSelected: !permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes
            },
            {
              title: 'Yes - Updatable',
              message: `The role of the manager can be transferred to another address. However, this permission will remain updatable. In the future, the manager can change this permission to be permanently allowed or permanently forbidden.`,
              isSelected: permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes && !permissionDetails.hasForbiddenTimes
            },
            {
              title: 'Yes - Frozen',
              message: `The role of the manager can always be transferred to another address. This permission is permanently permitted.`,
              isSelected: !permissionDetails.hasNeutralTimes && !permissionDetails.hasForbiddenTimes
            }
          ]}
          onSwitchChange={(idx) => {

            collections.updateCollection({
              ...collection,
              collectionPermissions: {
                ...collection.collectionPermissions,
                canUpdateManager: idx === 0 ? [{
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
                }] : idx == 1 ? []
                  : [{
                    defaultValues: {
                      timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                      permittedTimes: [],
                      forbiddenTimes: [],
                    },
                    combinations: [{
                      permittedTimesOptions: { invertDefault: false, allValues: true, noValues: false },
                      forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: true },
                      timelineTimesOptions: { invertDefault: false, allValues: true, noValues: false },
                    }]
                  }]
              }
            });
          }}

        />

        <br />
        <br />
      </>
      }
    />
    ,
    disabled: !!err,

  }
}