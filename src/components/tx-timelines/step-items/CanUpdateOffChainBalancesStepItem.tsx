import { TimedUpdatePermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission } from "bitbadgesjs-utils";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanUpdateBalancesStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [checked, setChecked] = useState<boolean>(true);

  const [err, setErr] = useState<Error | null>(null);
  if (!collection) return EmptyStepItem;

  const permissionDetails = getPermissionDetails(castTimedUpdatePermissionToUniversalPermission(collection?.collectionPermissions.canUpdateOffChainBalancesMetadata ?? []), TimedUpdatePermissionUsedFlags);
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
                    combinations: [{}]
                  }] : idx == 1 ? [] : [{
                    defaultValues: {
                      timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                      permittedTimes: [],
                      forbiddenTimes: [],
                    },
                    combinations: [{
                      permittedTimesOptions: { allValues: true },
                      forbiddenTimesOptions: { noValues: true },
                      timelineTimesOptions: { allValues: true },
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