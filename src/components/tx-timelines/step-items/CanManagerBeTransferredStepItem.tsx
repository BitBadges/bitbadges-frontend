import { TimedUpdatePermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission } from "bitbadgesjs-utils";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionsOverview, getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanManagerBeTransferredStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [checked, setChecked] = useState<boolean>(true);

  const [err, setErr] = useState<Error | null>(null);
  if (!collection) return EmptyStepItem;

  const handleSwitchChangeIdxOnly = (idx: number) => {
    handleSwitchChange(idx);
  }

  const handleSwitchChange = (idx: number, frozen?: boolean) => {

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
          combinations: [{}]
        }] : idx == 1 && !frozen ? []
          : [{
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
  }

  const permissionDetails = getPermissionDetails(castTimedUpdatePermissionToUniversalPermission(collection?.collectionPermissions.canUpdateManager ?? []), TimedUpdatePermissionUsedFlags);
  const AdditionalNode = <>
    <div className="flex-center">
      <PermissionsOverview
        span={24}
        collectionId={collection.collectionId}
        permissionName="canUpdateManager"
        onFreezePermitted={(frozen: boolean) => {
          handleSwitchChange(1, frozen);
        }}
      />
    </div>
  </>;
  return {
    title: 'Transfer manager role?',
    description: `Can the manager role be updated to another address in the future?`,
    node: <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName="canUpdateManager"
      node={<>
        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'No',
              message: `The role of the manager cannot be transferred to another address.`,
              isSelected: !permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes,
              additionalNode: AdditionalNode
            },
            {
              title: 'Yes',
              message: `The role of the manager can be transferred to another address.`,
              isSelected: (permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes && !permissionDetails.hasForbiddenTimes) || (!permissionDetails.hasNeutralTimes && !permissionDetails.hasForbiddenTimes),
              additionalNode: AdditionalNode,
            },
          ]}
          onSwitchChange={handleSwitchChangeIdxOnly}
        />

        <br />
        <br />
      </>
      }
    />,
    disabled: !!err,

  }
}