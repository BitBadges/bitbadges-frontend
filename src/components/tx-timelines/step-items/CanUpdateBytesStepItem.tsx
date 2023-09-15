import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";
import { BeforeAfterPermission } from "../form-items/BeforeAfterPermission";
import { castTimedUpdatePermissionToUniversalPermission, TimedUpdatePermissionUsedFlags } from "bitbadgesjs-utils";
import { getPermissionDataSource } from "../../collection-page/PermissionsInfo";

export function CanUpdateBalancesStepItem(

  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [checked, setChecked] = useState<boolean>(true);

  const [err, setErr] = useState<Error | null>(null);
  if (!collection) return EmptyStepItem;

  // const permissionDetails = getPermissionDataSource(castBalancesActionPermissionToUniversalPermission(collection?.collectionPermissions.canCreateMoreBadges ?? []), BalancesActionPermissionUsedFlags);
  const permissionDetails = getPermissionDataSource(castTimedUpdatePermissionToUniversalPermission(collection?.collectionPermissions.canUpdateOffChainBalancesMetadata ?? []), TimedUpdatePermissionUsedFlags);
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
        node={<>
          <SwitchForm
            showCustomOption
            options={[
              {
                title: 'No',
                message: `The balances are permanently frozen and can never be updated.`,
                isSelected: !permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes
              },
              {

                title: 'Yes - Updatable',
                message: `The balances can be updated by the manager. This permission can be disabled at any time by the manager, if desired.`,
                isSelected: permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes && !permissionDetails.hasForbiddenTimes
              },
              {
                title: 'Yes - Frozen',
                message: `The balances can be updated by the manager. This permission is permanently permitted.`,
                isSelected: !permissionDetails.hasNeutralTimes && !permissionDetails.hasForbiddenTimes
              }
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
                  }] : idx == 1 ? [] : [{
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
      />,
    disabled: !!err,
  }
}