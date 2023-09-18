import { ActionPermissionUsedFlags, castActionPermissionToUniversalPermission } from "bitbadgesjs-utils";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanDeleteStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [checked, setChecked] = useState<boolean>(true);

  const [err, setErr] = useState<Error | null>(null);
  if (!collection) return EmptyStepItem;

  const permissionDetails = getPermissionDetails(castActionPermissionToUniversalPermission(collection?.collectionPermissions.canDeleteCollection ?? []), ActionPermissionUsedFlags);

  return {
    title: 'Can Delete?',
    description: ``,
    node: <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName="canDeleteCollection"
      node={<>

        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'No',
              message: `Moving forward, the collection can never be deleted by the manager. This permission can not be updated. It will be frozen forever.`,
              isSelected: !permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes
            },
            {
              title: 'Yes - Updatable',
              message: `The collection can be deleted by the manager. This permission can be disabled at any time by the manager, if desired.`,
              isSelected: permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes && !permissionDetails.hasForbiddenTimes
            },
            {
              title: 'Yes - Frozen',
              message: `The collection can be deleted by the manager. This permission is permanently permitted.`,
              isSelected: !permissionDetails.hasNeutralTimes && !permissionDetails.hasForbiddenTimes
            }
          ]}
          onSwitchChange={(idx) => {

            collections.updateCollection({
              ...collection,
              collectionPermissions: {
                ...collection.collectionPermissions,
                canDeleteCollection: idx === 0 ? [{
                  defaultValues: {
                    permittedTimes: [],
                    forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                  },
                  combinations: [{}]
                }] : idx == 1 ? [] : [{
                  defaultValues: {
                    permittedTimes: [],
                    forbiddenTimes: [],
                  },
                  combinations: [{
                    permittedTimesOptions: { allValues: true },
                    forbiddenTimesOptions: { noValues: true },
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