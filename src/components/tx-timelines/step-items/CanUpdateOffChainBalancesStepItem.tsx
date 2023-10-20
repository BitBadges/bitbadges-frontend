import { MetadataAddMethod, TimedUpdatePermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission } from "bitbadgesjs-utils";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanUpdateBalancesStepItem() {
  const collections = useCollectionsContext();
  const txTimelineContext = useTxTimelineContext();
  const addMethod = txTimelineContext.offChainAddMethod;
  // const existingCollectionId = txTimelineContext.existingCollectionId;
  // const existingCollection = collections.getCollection(existingCollectionId);
  const collection = collections.getCollection(MSG_PREVIEW_ID);
  const [checked, setChecked] = useState<boolean>(true);

  const [err, setErr] = useState<Error | null>(null);
  if (!collection) return EmptyStepItem;

  const handleSwitchChangeIdxOnly = (idx: number) => {
    handleSwitchChange(idx);
  }

  // const isBitBadgesHosted = existingCollection && existingCollection.offChainBalancesMetadataTimeline.length > 0 && existingCollection?.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri.startsWith('https://bitbadges.nyc3.digitaloceanspaces.com/balances/');
  // const isStillBitBadgesHosted = collection && collection.offChainBalancesMetadataTimeline.length > 0 && collection?.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri.startsWith('https://bitbadges.nyc3.digitaloceanspaces.com/balances/');

  const handleSwitchChange = (idx: number, frozen?: boolean) => {
    //TODO:  Handle weird edge cases where it is updated behind the scenes (not via form) and we can't actually update BB hosted -> IPFS if selected (or other weird edge cases)
    //We make some assumptions 

    // if (idx == 0 && isBitBadgesHosted && isStillBitBadgesHosted && txTimelineContext.transfers.length > 0) {
    //   //This is just a check in case the collection was updated behind the scenes and not through the stanard timeline form
    //   //would throw if we can't update from bitbadges hosted to IPFS hosted
    //   const validateErr = validateOffChainBalancesMetadataUpdate(existingCollection.offChainBalancesMetadataTimeline, collection.offChainBalancesMetadataTimeline, existingCollection.collectionPermissions.canUpdateOffChainBalancesMetadata);
    //   setErr(validateErr);
    // }

    collections.updateCollection({
      collectionId: MSG_PREVIEW_ID,
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

  const neverHasManager = collection.managerTimeline.every(x => !x);

  const permissionDetails = getPermissionDetails(castTimedUpdatePermissionToUniversalPermission(collection?.collectionPermissions.canUpdateOffChainBalancesMetadata ?? []), TimedUpdatePermissionUsedFlags);

  return {
    title: 'Can update balances?',
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
                message:
                  addMethod === MetadataAddMethod.UploadUrl ?
                    `The previously selected URL will be permanent and non-updatable on-chain. 
                    Note this does not mean the balances returned by the URL are permanently frozen, just the URL itself.
                    To create immutable balances, you also need to make sure the URL you are using is a permanent, non-updatable file storage solution, such as IPFS.
                    ` :
                    `The previously assigned balances will be permanently frozen and can never be updated. 
                The URL for the balances will be set to non-updatable, and we will store using IPFS, a permanent and decentralized file storage solution.`,
                isSelected: !permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes,
              },
              {
                title: 'Yes',
                message:
                  addMethod === MetadataAddMethod.UploadUrl ?
                    `The previously selected URL will be updatable on-chain. The manager will be able to update the URL (and thus the balances) in the future.` :
                    <> {`The balances can be updated. 
                We will host the balances via the centralized BitBadges servers and allow the current manager of the collection to update the balances at any time.
                This privilege can be disabled in the future, and you can also choose to move to a self-hosted solution at any time.
                `}
                      < br />
                      <br />
                      {neverHasManager ? 'Disabled because no manager was selected.' : 'Note that this permission is tied to the manager. Please make sure the manager is set correctly.'}
                    </>,
                isSelected: (permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes && !permissionDetails.hasForbiddenTimes) || (!permissionDetails.hasNeutralTimes && !permissionDetails.hasForbiddenTimes),
                disabled: neverHasManager
              },
            ]}
            onSwitchChange={handleSwitchChangeIdxOnly}

          />
        </>
        }
      />,
    disabled: !!err || (neverHasManager && (permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes && !permissionDetails.hasForbiddenTimes) || (!permissionDetails.hasNeutralTimes && !permissionDetails.hasForbiddenTimes)),
  }
}