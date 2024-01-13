import { useState } from "react";

import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { getDetailsForCollectionPermission } from "../../../bitbadges-api/utils/permissions";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";
import { AdditionalPermissionSelectNode, handleSwitchChangeIdxOnly } from "./CanDeleteStepItem";

export function CanUpdateStandardsStepItem() {


  const collection = useCollection(NEW_COLLECTION_ID);

  const txTimelineContext = useTxTimelineContext();
  const [checked, setChecked] = useState<boolean>(!txTimelineContext.existingCollectionId);
  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem;
  const permissionDetails = getDetailsForCollectionPermission(collection, "canUpdateStandards");

  const AdditionalNode = () => <>
    <AdditionalPermissionSelectNode permissionName="canUpdateStandards" />
  </>



  return {
    title: 'Can update standards?',
    description: `Can the manager update the standards for this collection?`,
    node: () => <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName="canUpdateStandards"
      node={() => <>
        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'No',
              message: `The manager can never update the standards for this collection. They will be frozen forever.`,
              isSelected: permissionDetails.isAlwaysFrozenAndForbidden,
              additionalNode: AdditionalNode
            },
            {
              title: 'Yes',
              message: `The manager can update the standards for this collection`,
              isSelected: permissionDetails.isAlwaysPermittedOrNeutral,
              additionalNode: AdditionalNode
            }
          ]}
          onSwitchChange={(idx) => { handleSwitchChangeIdxOnly(idx, "canUpdateStandards") }}
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