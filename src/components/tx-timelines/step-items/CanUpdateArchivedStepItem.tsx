import { useState } from "react";

import { EmptyStepItem, NEW_COLLECTION_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { getDetailsForCollectionPermission } from "../../../bitbadges-api/utils/permissions";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";
import { AdditionalPermissionSelectNode, handleSwitchChangeIdxOnly } from "./CanDeleteStepItem";

export function CanArchiveCollectionStepItem() {
  const collection = useCollection(NEW_COLLECTION_ID);

  const [checked, setChecked] = useState<boolean>(true);
  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem;

  const permissionDetails = getDetailsForCollectionPermission(collection, "canArchiveCollection");

  const AdditionalNode = () => <>
    <AdditionalPermissionSelectNode permissionName="canArchiveCollection" />
  </>

  return {
    title: 'Can archive / unarchive collection?',
    description: `When a collection is archived, all transaactions are disabled until unarchived.`,
    node: () => <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName="canArchiveCollection"
      node={() => <>
        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'No',
              message: `The collection can never be archived or unarchived by the manager. This permission can not be updated. It will be frozen forever.`,
              isSelected: permissionDetails.isAlwaysFrozenAndForbidden,
              additionalNode: AdditionalNode
            },
            {
              title: 'Yes',
              message: `The collection can be archived or unarchived by the manager.`,
              isSelected: permissionDetails.isAlwaysPermittedOrNeutral,
              additionalNode: AdditionalNode
            }
          ]}
          onSwitchChange={(idx) => { handleSwitchChangeIdxOnly(idx, "canArchiveCollection") }}
        />
      </>
      }
    />
    ,
    disabled: !!err,

  }
}