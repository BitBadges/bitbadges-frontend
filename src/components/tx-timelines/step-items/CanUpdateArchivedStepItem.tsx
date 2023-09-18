import { TimedUpdatePermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission } from "bitbadgesjs-utils";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanArchiveCollectionStepItem(
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [checked, setChecked] = useState<boolean>(true);

  const [err, setErr] = useState<Error | null>(null);
  if (!collection) return EmptyStepItem;

  const permissionDetails = getPermissionDetails(castTimedUpdatePermissionToUniversalPermission(collection?.collectionPermissions.canArchiveCollection ?? []), TimedUpdatePermissionUsedFlags);

  return {
    title: 'Can archive / unarchive collection?',
    description: ``,
    node: <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName="canArchiveCollection"
      node={<>
        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'No',
              message: `The collection can never be archived or unarchived by the manager. This permission can not be updated. It will be frozen forever.`,
              isSelected: !permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes
            },
            {
              title: 'Yes - Updatable',
              message: `The collection can be archived or unarchived by the manager. This permission can be disabled at any time by the manager, if desired.`,
              isSelected: permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes && !permissionDetails.hasForbiddenTimes
            },
            {
              title: 'Yes - Frozen',
              message: `The collection can be archived or unarchived by the manager. This permission is permanently permitted.`,
              isSelected: !permissionDetails.hasNeutralTimes && !permissionDetails.hasForbiddenTimes
            }
          ]}
          onSwitchChange={(idx) => {

            collections.updateCollection({
              ...collection,
              collectionPermissions: {
                ...collection.collectionPermissions,
                canArchiveCollection: idx === 0 ? [{
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
    />
    ,
    disabled: !!err,

  }
}