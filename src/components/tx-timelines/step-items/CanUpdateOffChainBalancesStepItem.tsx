import { TimedUpdatePermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission } from "bitbadgesjs-utils";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionsOverview, getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanUpdateBalancesStepItem() {
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
        canUpdateOffChainBalancesMetadata: idx === 0 ? [{
          defaultValues: {
            timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
            permittedTimes: [],
            forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
          },
          combinations: [{}]
        }] : idx == 1 && !frozen ? [] : [{
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


  const AdditionalNode = <>
    <div className="flex-center">
      <PermissionsOverview
        span={24}
        collectionId={collection.collectionId}
        permissionName="canUpdateOffChainBalancesMetadata"
        onFreezePermitted={(frozen: boolean) => {
          handleSwitchChange(1, frozen);
        }}
      />
    </div>
  </>;

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
                isSelected: !permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes,
                additionalNode: AdditionalNode
              },
              {
                title: 'Yes',
                message: `The balances can be updated by the manager.`,
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