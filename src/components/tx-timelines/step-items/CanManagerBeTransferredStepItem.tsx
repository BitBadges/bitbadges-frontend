import { useState } from "react";

import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { getDetailsForCollectionPermission } from "../../../bitbadges-api/utils/permissions";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";
import { AdditionalPermissionSelectNode, handleSwitchChangeIdxOnly } from "./CanDeleteStepItem";

export function CanManagerBeTransferredStepItem() {

  const collection = useCollection(NEW_COLLECTION_ID);
  const txTimelineContext = useTxTimelineContext();
  const [checked, setChecked] = useState<boolean>(!txTimelineContext.existingCollectionId);

  const [err, setErr] = useState<Error | null>(null);
  if (!collection) return EmptyStepItem;


  const permissionDetails = getDetailsForCollectionPermission(collection, "canUpdateManager");
  const AdditionalNode = () => <>
    <AdditionalPermissionSelectNode permissionName="canUpdateManager" />
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
          onSwitchChange={(idx) => { handleSwitchChangeIdxOnly(idx, "canUpdateManager") }}
        />
      </>
      }
    />,
    disabled: !!err,

  }
}