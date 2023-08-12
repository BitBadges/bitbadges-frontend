import { CollectionPermissions, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission } from "bitbadgesjs-proto";
import { MetadataAddMethod } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { FOREVER_DATE } from "../../../utils/dates";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { useState } from "react";

//TODO: Split this into canUpdateCollection vs canUpdateBadgeMetadata
export function UpdatableMetadataSelectStepItem(
  handledPermissions: CollectionPermissions<bigint>,
  setHandledPermissions: (permissions: CollectionPermissions<bigint>) => void,
  addMethod: MetadataAddMethod,
  collectionMetadataUpdate: boolean,
  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [checked, setChecked] = useState<boolean>(true);

  const [err, setErr] = useState<Error | null>(null);
  if (!collection) return EmptyStepItem;

  const options = [];
  options.push({
    title: 'No',
    message: `${addMethod === MetadataAddMethod.UploadUrl ? 'The URIs for the metadata (i.e. the self-hosted ones provided by you)' : 'The metadata'} will be frozen and cannot be updated after this transaction.`,
    isSelected: collectionMetadataUpdate ? handledPermissions.canUpdateCollectionMetadata.length > 0 && collection?.collectionPermissions.canUpdateCollectionMetadata.length > 0 :
      handledPermissions.canUpdateBadgeMetadata.length > 0 && collection?.collectionPermissions.canUpdateBadgeMetadata.length > 0

  })

  options.push({
    title: 'Yes',
    message: <div>{`${addMethod === MetadataAddMethod.UploadUrl ? 'The URIs (i.e. the self-hosted URIs provided by you)' : 'The metadata'} can be updated.`}</div>,
    isSelected: !collectionMetadataUpdate ? handledPermissions.canUpdateBadgeMetadata.length > 0 && collection?.collectionPermissions.canUpdateBadgeMetadata.length === 0 :
      handledPermissions.canUpdateCollectionMetadata.length > 0 && collection?.collectionPermissions.canUpdateCollectionMetadata.length === 0,
  });

  let description = `Following this transaction, do you want this metadata to remain updatable or be frozen? `;


  return {
    title: collectionMetadataUpdate ? 'Updatable Collection Metadata?' : 'Updatable Badge Metadata?',
    description: description,
    node: <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName={collectionMetadataUpdate ? 'canUpdateCollectionMetadata' : 'canUpdateBadgeMetadata'}
      existingCollectionId={existingCollectionId}
      node={

        <SwitchForm
          options={options}
          onSwitchChange={(_idx, title) => {
            if (collectionMetadataUpdate) {

              setHandledPermissions({
                ...handledPermissions,
                canUpdateCollectionMetadata: [{} as TimedUpdatePermission<bigint>]
              });

              if (title === "Yes") {
                collections.updateCollection({
                  ...collection,
                  collectionPermissions: {
                    ...collection.collectionPermissions,
                    canUpdateCollectionMetadata: []
                  }
                });

              } else {
                collections.updateCollection({
                  ...collection,
                  collectionPermissions: {
                    ...collection.collectionPermissions,

                    canUpdateCollectionMetadata: [{
                      defaultValues: {
                        timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
                        permittedTimes: [],
                        forbiddenTimes: [{ start: 1n, end: FOREVER_DATE }],
                      },
                      combinations: [{
                        permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                        forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                        timelineTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      }]
                    }]
                  }

                });
              }
            } else {

              setHandledPermissions({
                ...handledPermissions,
                canUpdateBadgeMetadata: [{} as TimedUpdateWithBadgeIdsPermission<bigint>]
              });

              if (title === "Yes") {
                collections.updateCollection({
                  ...collection,
                  collectionPermissions: {
                    ...collection.collectionPermissions,
                    canUpdateBadgeMetadata: []
                  }
                });

              } else {
                collections.updateCollection({
                  ...collection,
                  collectionPermissions: {
                    ...collection.collectionPermissions,
                    canUpdateBadgeMetadata: [{
                      defaultValues: {
                        badgeIds: [{ start: 1n, end: FOREVER_DATE }],
                        timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
                        permittedTimes: [],
                        forbiddenTimes: [{ start: 1n, end: FOREVER_DATE }],
                      },
                      combinations: [{
                        badgeIdsOptions: { invertDefault: false, allValues: false, noValues: false },
                        permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                        forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                        timelineTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      }]
                    }]
                  }

                });
              }
            }
          }}

        />
      }
    />,
    disabled: !!err || (!collectionMetadataUpdate ? handledPermissions.canUpdateBadgeMetadata.length === 0 : handledPermissions.canUpdateCollectionMetadata.length === 0),
  }
}