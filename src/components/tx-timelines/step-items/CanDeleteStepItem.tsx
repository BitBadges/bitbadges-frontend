import { ActionPermissionUsedFlags, castActionPermissionToUniversalPermission } from "bitbadgesjs-utils";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionsOverview, getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanDeleteStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [checked, setChecked] = useState<boolean>(true);

  const [err, setErr] = useState<Error | null>(null);
  if (!collection) return EmptyStepItem;

  const permissionDetails = getPermissionDetails(castActionPermissionToUniversalPermission(collection?.collectionPermissions.canDeleteCollection ?? []), ActionPermissionUsedFlags);

  const handleSwitchChangeIdxOnly = (idx: number) => {
    handleSwitchChange(idx);
  }


  const handleSwitchChange = (idx: number, frozen?: boolean) => {
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
        }] : idx == 1 && !frozen ? [] : [{
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
  }
  const AdditionalNode = <>
    <div className="flex-center">
      <PermissionsOverview
        span={24}
        collectionId={collection.collectionId}
        permissionName="canDeleteCollection"
        onFreezePermitted={(frozen: boolean) => {
          handleSwitchChange(1, frozen);
        }}
      />
    </div>
  </>;

  return {
    title: 'Can Delete?',
    description: `Can the collection be deleted?`,
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
              isSelected: !permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes,
              additionalNode: AdditionalNode
            },
            {
              title: 'Yes',
              message: `The collection can be deleted by the manager.`,
              isSelected: (permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes && !permissionDetails.hasForbiddenTimes) || (!permissionDetails.hasNeutralTimes && !permissionDetails.hasForbiddenTimes),
              additionalNode: AdditionalNode
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