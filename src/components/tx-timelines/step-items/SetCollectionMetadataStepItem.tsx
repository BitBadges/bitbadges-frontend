import { MetadataAddMethod, TimedUpdateWithBadgeIdsPermissionUsedFlags, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, sortUintRangesAndMergeIfNecessary, validateCollectionMetadataUpdate } from "bitbadgesjs-utils";
import { MetadataForm } from "../form-items/MetadataForm";

import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { InformationDisplayCard } from "../../display/InformationDisplayCard";
import { ErrDisplay } from "../form-items/ErrDisplay";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function SetCollectionMetadataStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);
  const collectionMetadata = collection?.cachedCollectionMetadata;
  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const canUpdateCollectionMetadata = txTimelineContext.updateCollectionMetadataTimeline;
  const setCanUpdateCollectionMetadata = txTimelineContext.setUpdateCollectionMetadataTimeline;
  const addMethod = txTimelineContext.collectionAddMethod;
  const setAddMethod = txTimelineContext.setCollectionAddMethod;

  const err = startingCollection && collection ? validateCollectionMetadataUpdate(startingCollection.collectionMetadataTimeline, collection.collectionMetadataTimeline, startingCollection.collectionPermissions.canUpdateCollectionMetadata) : undefined;

  if (!collection) return EmptyStepItem

  const canUpdateBadgeMetadataRes = getPermissionDetails(
    startingCollection ? castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(startingCollection.collectionPermissions.canUpdateBadgeMetadata ?? []) : [],
    TimedUpdateWithBadgeIdsPermissionUsedFlags,
    undefined,
    [{ start: 1n, end: getTotalNumberOfBadges(collection) }]
  );

  const toUpdateBadges = sortUintRangesAndMergeIfNecessary(canUpdateBadgeMetadataRes.dataSource.filter(x => !x.forbidden).map(x => x.badgeIds ?? []).flat(), true);

  console.log(!collection, addMethod === MetadataAddMethod.Manual, collectionMetadata?.name, addMethod === MetadataAddMethod.UploadUrl, collection.collectionMetadataTimeline.length == 0, collection.badgeMetadataTimeline.length == 0, addMethod === MetadataAddMethod.CSV, !collectionMetadata?.name, !!err)


  return {
    title: 'Set Collection Metadata',
    description: <>{'Provide details about the collection you are creating.'}
    </>,

    node: <UpdateSelectWrapper
      updateFlag={canUpdateCollectionMetadata}
      setUpdateFlag={setCanUpdateCollectionMetadata}
      jsonPropertyPath='collectionMetadataTimeline'
      permissionName='canUpdateCollectionMetadata'
      disableJson
      node={<InformationDisplayCard title='Collection Metadata'>{
        collection && <div>
          <ErrDisplay err={err} />
          <MetadataForm
            isCollectionSelect
            badgeIds={toUpdateBadges}
            addMethod={addMethod}
            setAddMethod={setAddMethod}
          />
        </div>
      }</InformationDisplayCard>
      }
    />,
    disabled: !collection || (addMethod === MetadataAddMethod.Manual && !(collectionMetadata?.name))
      || (addMethod === MetadataAddMethod.UploadUrl && ((collection.collectionMetadataTimeline.length == 0)
        || (collection.badgeMetadataTimeline.length == 0)))
      || (addMethod === MetadataAddMethod.CSV && !(collectionMetadata?.name))
      || !!err,
  }
}