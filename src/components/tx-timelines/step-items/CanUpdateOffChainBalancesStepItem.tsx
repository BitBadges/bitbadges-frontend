import { MetadataAddMethod } from "bitbadgesjs-utils";
import { useState } from "react";

import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { neverHasManager } from "../../../bitbadges-api/utils/manager";
import { getDetailsForCollectionPermission } from "../../../bitbadges-api/utils/permissions";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";
import { AdditionalPermissionSelectNode, handleSwitchChangeIdxOnly } from "./CanDeleteStepItem";


export function CanUpdateBalancesStepItem() {

  const txTimelineContext = useTxTimelineContext();
  const addMethod = txTimelineContext.offChainAddMethod;
  const collection = useCollection(NEW_COLLECTION_ID);
  const [checked, setChecked] = useState<boolean>(true);
  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem;

  //TODO:  Handle weird edge cases where it is updated behind the scenes by the user (not via form) and we can't actually update BB hosted -> IPFS if selected (or other weird edge cases)
  //Currently it is caught by simulation

  const noManager = neverHasManager(collection);
  const permissionDetails = getDetailsForCollectionPermission(collection, "canUpdateOffChainBalancesMetadata");

  return {
    title: 'Can update balances?',
    description: ``,
    node: () => <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName="canUpdateOffChainBalancesMetadata"
      node={() => <>
        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'No',
              message:
                addMethod === MetadataAddMethod.UploadUrl || collection.balancesType === "Off-Chain - Non-Indexed" ?
                  `The previously selected URL will be permanent and non-updatable on-chain. 
                    Note this does not mean the balances returned by the URL are permanently frozen, just the URL itself.
                    To create immutable balances, you also need to make sure the URL you are using is a permanent, non-updatable file storage solution, such as IPFS.
                    ` :
                  `The previously assigned balances will be permanently frozen and can never be updated. 
                The URL for the balances will be set to non-updatable, and we will store using IPFS, a permanent and decentralized file storage solution.`,
              isSelected: permissionDetails.isAlwaysFrozenAndForbidden,
              additionalNode: addMethod === MetadataAddMethod.UploadUrl || collection.balancesType === "Off-Chain - Non-Indexed" ?
                () => <AdditionalPermissionSelectNode permissionName="canUpdateOffChainBalancesMetadata" />
                : undefined
            },
            {
              title: 'Yes',
              message:
                addMethod === MetadataAddMethod.UploadUrl || collection.balancesType === "Off-Chain - Non-Indexed" ?
                  `The previously selected URL will be updatable on-chain. The manager will be able to update the URL (and thus the balances) in the future.` :
                  <> {`The balances can be updated. 
                We will host the balances via the centralized BitBadges servers and allow the current manager of the collection to update the balances at any time.
                This privilege can be disabled in the future, and you can also choose to move to a self-hosted solution at any time.
                `}
                    < br />
                    <br />
                    {noManager ? 'Disabled because no manager was selected.' : 'This permission is tied to the manager. Please make sure the manager is set correctly.'}
                  </>,
              isSelected: permissionDetails.isAlwaysPermittedOrNeutral,
              disabled: noManager,
              additionalNode: addMethod === MetadataAddMethod.UploadUrl || collection.balancesType === "Off-Chain - Non-Indexed" ?
                () => <AdditionalPermissionSelectNode permissionName="canUpdateOffChainBalancesMetadata" />
                : undefined
            },
          ]}
          onSwitchChange={(idx) => { handleSwitchChangeIdxOnly(idx, "canUpdateOffChainBalancesMetadata") }}
        />
      </>
      }
    />,
    disabled: !!err || addMethod === MetadataAddMethod.UploadUrl || collection.balancesType === "Off-Chain - Non-Indexed" ? false :
      (noManager && (permissionDetails.hasNeutralTimes && !permissionDetails.hasPermanentlyPermittedTimes && !permissionDetails.hasPermanentlyForbiddenTimes) || (!permissionDetails.hasNeutralTimes && !permissionDetails.hasPermanentlyForbiddenTimes)),
  }
}