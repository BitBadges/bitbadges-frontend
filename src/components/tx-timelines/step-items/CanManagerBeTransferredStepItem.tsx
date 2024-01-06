import { useState } from "react";

import { EmptyStepItem, NEW_COLLECTION_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { getDetailsForCollectionPermission } from "../../../bitbadges-api/utils/permissions";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionsOverview } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanManagerBeTransferredStepItem() {

  const collection = useCollection(NEW_COLLECTION_ID);
  const [checked, setChecked] = useState<boolean>(true);

  const [err, setErr] = useState<Error | null>(null);
  if (!collection) return EmptyStepItem;

  const handleSwitchChangeIdxOnly = (idx: number) => {
    handleSwitchChange(idx);
  }

  const handleSwitchChange = (idx: number, frozen?: boolean) => {

    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      collectionPermissions: {
        canUpdateManager: idx === 0 ? [{
          timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
          permittedTimes: [],
          forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        }] : idx == 1 && !frozen ? []
          : [{
            timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
            permittedTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
            forbiddenTimes: [],
          }]
      }
    });
  }

  const permissionDetails = getDetailsForCollectionPermission(collection, "canUpdateManager");
  const AdditionalNode = () => <>
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
  </>

  return {
    title: 'Transfer manager role?',
    description: `Can the manager role be updated to another address in the future?`,
    node: () => <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName="canUpdateManager"
      node={() => <>
        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'No',
              message: `The role of the manager cannot be transferred to another address.`,
              isSelected: permissionDetails.isAlwaysFrozenAndForbidden,
              additionalNode: AdditionalNode
            },
            {
              title: 'Yes',
              message: `The role of the manager can be transferred to another address.`,
              isSelected: permissionDetails.isAlwaysPermittedOrNeutral,
              additionalNode: AdditionalNode,
            },
          ]}
          onSwitchChange={handleSwitchChangeIdxOnly}
        />
      </>
      }
    />,
    disabled: !!err,

  }
}