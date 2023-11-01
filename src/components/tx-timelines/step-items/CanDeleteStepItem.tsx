import { ActionPermissionUsedFlags, castActionPermissionToUniversalPermission } from "bitbadgesjs-utils";
import { useState } from "react";

import { EmptyStepItem, NEW_COLLECTION_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionsOverview, getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";
import { isCompletelyNeutralOrCompletelyPermitted, isCompletelyForbidden } from "./CanUpdateOffChainBalancesStepItem";
import { neverHasManager } from "../../../bitbadges-api/utils/manager";
import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";

export function CanDeleteStepItem() {

  const collection = useCollection(NEW_COLLECTION_ID);
  const [checked, setChecked] = useState<boolean>(true);

  const [err, setErr] = useState<Error | null>(null);
  if (!collection) return EmptyStepItem;

  const permissionDetails = getPermissionDetails(castActionPermissionToUniversalPermission(collection?.collectionPermissions.canDeleteCollection ?? []), ActionPermissionUsedFlags, neverHasManager(collection));

  const handleSwitchChangeIdxOnly = (idx: number) => {
    handleSwitchChange(idx);
  }

  const handleSwitchChange = (idx: number, frozen?: boolean) => {
    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      collectionPermissions: {
        canDeleteCollection: idx === 0 ? [{
          permittedTimes: [],
          forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        }] : idx == 1 && !frozen ? [] : [{
          permittedTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
          forbiddenTimes: [],
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
              isSelected: isCompletelyForbidden(permissionDetails),
              additionalNode: AdditionalNode
            },
            {
              title: 'Yes',
              message: `The collection can be deleted by the manager.`,
              isSelected: isCompletelyNeutralOrCompletelyPermitted(permissionDetails),
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