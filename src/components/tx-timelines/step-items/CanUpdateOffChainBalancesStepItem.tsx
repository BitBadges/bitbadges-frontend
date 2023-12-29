import { MetadataAddMethod, TimedUpdatePermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission } from "bitbadgesjs-utils";
import { useState } from "react";

import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { getPermissionDetails, PermissionsOverview } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";
import { neverHasManager } from "../../../bitbadges-api/utils/manager";
import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";

export const isCompletelyForbidden = (permissionDetails: ReturnType<typeof getPermissionDetails>) => {
  return !permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes;
}

export const isCompletelyNeutralOrCompletelyPermitted = (permissionDetails: ReturnType<typeof getPermissionDetails>) => {
  // With the way we structure our timelines, we either check if it is completely neutral or completely permitted
  return (permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes && !permissionDetails.hasForbiddenTimes)
    || (permissionDetails.hasPermittedTimes && !permissionDetails.hasNeutralTimes && !permissionDetails.hasForbiddenTimes);
}

export function CanUpdateBalancesStepItem() {

  const txTimelineContext = useTxTimelineContext();
  const addMethod = txTimelineContext.offChainAddMethod;
  const collection = useCollection(NEW_COLLECTION_ID);
  const [checked, setChecked] = useState<boolean>(true);
  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem;

  const handleSwitchChangeIdxOnly = (idx: number) => {
    handleSwitchChange(idx);
  }

  const handleSwitchChange = (idx: number, frozen?: boolean) => {
    //TODO:  Handle weird edge cases where it is updated behind the scenes by the user (not via form) and we can't actually update BB hosted -> IPFS if selected (or other weird edge cases)
    //Currently it is caught by simulation

    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      collectionPermissions: {

        canUpdateOffChainBalancesMetadata: idx === 0 ? [{
          timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
          permittedTimes: [],
          forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        }] : idx == 1 && !frozen ? [] : [{
          timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
          permittedTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
          forbiddenTimes: [],
        }]
      }
    });
  }

  const noManager = neverHasManager(collection);
  const permissionDetails = getPermissionDetails(castTimedUpdatePermissionToUniversalPermission(collection?.collectionPermissions.canUpdateOffChainBalancesMetadata ?? []), TimedUpdatePermissionUsedFlags, noManager);


  return {
    title: 'Can update balances?',
    description: ``,
    node: () =>  <PermissionUpdateSelectWrapper
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
                isSelected: isCompletelyForbidden(permissionDetails),
                additionalNode: addMethod === MetadataAddMethod.UploadUrl || collection.balancesType === "Off-Chain - Non-Indexed" ?
                  () => <div className="flex-center">
                    <PermissionsOverview
                      span={24}
                      collectionId={collection.collectionId}
                      permissionName="canUpdateOffChainBalancesMetadata"
                      onFreezePermitted={(frozen: boolean) => {
                        handleSwitchChange(1, frozen);
                      }}
                    />
                  </div>
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
                isSelected: isCompletelyNeutralOrCompletelyPermitted(permissionDetails),
                disabled: noManager,
                additionalNode: addMethod === MetadataAddMethod.UploadUrl || collection.balancesType === "Off-Chain - Non-Indexed" ?
                  () => <div className="flex-center">
                    <PermissionsOverview
                      span={24}
                      collectionId={collection.collectionId}
                      permissionName="canUpdateOffChainBalancesMetadata"
                      onFreezePermitted={(frozen: boolean) => {
                        handleSwitchChange(1, frozen);
                      }}
                    />
                  </div>
                  : undefined
              },
            ]}
            onSwitchChange={handleSwitchChangeIdxOnly}
          />
        </>
        }
      />,
    disabled: !!err || addMethod === MetadataAddMethod.UploadUrl || collection.balancesType === "Off-Chain - Non-Indexed" ? false :
      (noManager && (permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes && !permissionDetails.hasForbiddenTimes) || (!permissionDetails.hasNeutralTimes && !permissionDetails.hasForbiddenTimes)),
  }
}