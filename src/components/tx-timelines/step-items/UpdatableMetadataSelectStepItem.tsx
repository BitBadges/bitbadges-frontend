import { MetadataAddMethod } from "bitbadgesjs-utils";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

export function UpdatableMetadataSelectStepItem(

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
    isSelected: collectionMetadataUpdate ? collection?.collectionPermissions.canUpdateCollectionMetadata.length > 0 :
      collection?.collectionPermissions.canUpdateBadgeMetadata.length > 0

  })

  options.push({
    title: 'Yes',
    message: <div>{`${addMethod === MetadataAddMethod.UploadUrl ? 'The URIs (i.e. the self-hosted URIs provided by you)' : 'The metadata'} can be updated.`}</div>,
    isSelected: !collectionMetadataUpdate ? collection?.collectionPermissions.canUpdateBadgeMetadata.length === 0 :
      collection?.collectionPermissions.canUpdateCollectionMetadata.length === 0,
  });

  let description = `Following this transaction, do you want to be able to update the metadata for ${collectionMetadataUpdate ? 'the collection' : 'badges'}? This includes the name, description, image, and other metadata. See full list `

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
                        timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                        permittedTimes: [],
                        forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                      },
                      combinations: [{
                        // permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                        // forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                        // timelineTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      }]
                    }]
                  }

                });
              }
            } else {


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
                        badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
                        timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                        permittedTimes: [],
                        forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                      },
                      combinations: [{
                        // badgeIdsOptions: { invertDefault: false, allValues: false, noValues: false },
                        // permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                        // forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                        // timelineTimesOptions: { invertDefault: false, allValues: false, noValues: false },
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
    disabled: !!err
  }
}