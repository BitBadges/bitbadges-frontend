import { CollectionPermissions, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission } from "bitbadgesjs-proto";
import { MetadataAddMethod } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { FOREVER_DATE } from "../../../utils/dates";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";

//TODO: Split this into canUpdateCollection vs canUpdateBadgeMetadata
export function UpdatableMetadataSelectStepItem(
  handledPermissions: CollectionPermissions<bigint>,
  setHandledPermissions: (permissions: CollectionPermissions<bigint>) => void,
  addMethod: MetadataAddMethod
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];


  if (!collection) return EmptyStepItem;

  const options = [];
  options.push({
    title: 'No',
    message: `${addMethod === MetadataAddMethod.UploadUrl ? 'The URIs for the metadata (i.e. the self-hosted ones provided by you)' : 'The metadata'} will be frozen and cannot be updated.`,
    isSelected: handledPermissions.canUpdateBadgeMetadata.length > 0 && collection?.collectionPermissions.canUpdateBadgeMetadata.length > 0 &&
      handledPermissions.canUpdateCollectionMetadata.length > 0 && collection?.collectionPermissions.canUpdateCollectionMetadata.length > 0
  })

  options.push({
    title: 'Yes',
    message: <div>{`${addMethod === MetadataAddMethod.UploadUrl ? 'The URIs (i.e. the self-hosted URIs provided by you)' : 'The metadata'} can be updated.`}</div>,
    isSelected: handledPermissions.canUpdateBadgeMetadata.length > 0 && collection?.collectionPermissions.canUpdateBadgeMetadata.length === 0 &&
      handledPermissions.canUpdateCollectionMetadata.length > 0 && collection?.collectionPermissions.canUpdateCollectionMetadata.length === 0,
  });

  let description = ``;

  return {
    title: 'Updatable Metadata?',
    description: description,
    node: <SwitchForm

      options={options}
      onSwitchChange={(_idx, title) => {
        setHandledPermissions({
          ...handledPermissions,
          canUpdateBadgeMetadata: [{} as TimedUpdateWithBadgeIdsPermission<bigint>],
          canUpdateCollectionMetadata: [{} as TimedUpdatePermission<bigint>]
        });

        if (title === "Yes") {
          collections.updateCollection({
            ...collection,
            collectionPermissions: {
              ...collection.collectionPermissions,
              canUpdateBadgeMetadata: [],
              canUpdateCollectionMetadata: []
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
              }],
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
      }}
      helperMessage="*If this permission is enabled (set to Yes), the manager can disable it at anytime. However, once disabled (set to No), it can never be re-enabled."
    />,
    disabled: handledPermissions.canUpdateBadgeMetadata.length === 0 && handledPermissions.canUpdateCollectionMetadata.length === 0,
  }
}