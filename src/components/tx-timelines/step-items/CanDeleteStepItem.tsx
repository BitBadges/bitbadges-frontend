import { useState } from "react";

import { EmptyStepItem, NEW_COLLECTION_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { GenericCollectionPermissionWithDetails, getDetailsForCollectionPermission } from "../../../bitbadges-api/utils/permissions";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionNameString, PermissionsOverview } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

//These currently only support ActionPermission and TimedUpdatePermissions

export const handleSwitchChangeIdxOnly = (idx: number, permissionName: PermissionNameString) => {
  handleSwitchChange(idx, permissionName);
}

export const handleSwitchChange = (idx: number, permissionName: PermissionNameString, frozen?: boolean) => {
  let permissions: GenericCollectionPermissionWithDetails[] = idx === 0 ? [{
    permittedTimes: [],
    forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
  }] : idx == 1 && !frozen ? [] : [{
    permittedTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    forbiddenTimes: [],
  }];

  if (permissionName !== 'canDeleteCollection') {
    permissions = permissions.map(x => {
      return {
        ...x,
        timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }]
      }
    })
  }

  console.log(permissionName, permissions);

  updateCollection({
    collectionId: NEW_COLLECTION_ID,
    collectionPermissions: {
      [`${permissionName}`]: permissions
    }
  });
}

export const AdditionalPermissionSelectNode = ({
  permissionName
}: {
  permissionName: PermissionNameString
}) => {
  return <div className="flex-center">
    <PermissionsOverview
      span={24}
      collectionId={NEW_COLLECTION_ID}
      permissionName={permissionName}
      onFreezePermitted={(frozen: boolean) => {
        handleSwitchChange(1, permissionName, frozen);
      }}
    />
  </div>

}

export function CanDeleteStepItem() {
  const collection = useCollection(NEW_COLLECTION_ID);
  const [checked, setChecked] = useState<boolean>(true);
  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem;

  const permissionDetails = getDetailsForCollectionPermission(collection, "canDeleteCollection");

  const AdditionalNode = () => <>
    <AdditionalPermissionSelectNode permissionName="canDeleteCollection" />
  </>;

  return {
    title: 'Can Delete?',
    description: `Can the collection be deleted?`,
    node: () => <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName="canDeleteCollection"
      node={() => <>

        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'No',
              message: `Moving forward, the collection can never be deleted by the manager. This permission can not be updated. It will be frozen forever.`,
              isSelected: permissionDetails.isAlwaysFrozenAndForbidden,
              additionalNode: AdditionalNode
            },
            {
              title: 'Yes',
              message: `The collection can be deleted by the manager. We recommend this option, in case anything goes wrong.`,
              isSelected: permissionDetails.isAlwaysPermittedOrNeutral,
              additionalNode: AdditionalNode
            },
          ]}
          onSwitchChange={(idx: number) => { handleSwitchChangeIdxOnly(idx, "canDeleteCollection") }}
        />
        <br />
        <br />
      </>
      }
    />,
    disabled: !!err,
  }
}