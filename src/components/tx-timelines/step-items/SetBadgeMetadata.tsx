import { MetadataAddMethod, TimedUpdateWithBadgeIdsPermissionUsedFlags, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, sortUintRangesAndMergeIfNecessary, validateBadgeMetadataUpdate } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { InformationDisplayCard } from "../../display/InformationDisplayCard";
import { ErrDisplay } from "../form-items/ErrDisplay";
import { MetadataForm } from "../form-items/MetadataForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function SetBadgeMetadataStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[`${MSG_PREVIEW_ID}`];
  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const canUpdateBadgeMetadata = txTimelineContext.updateBadgeMetadataTimeline;
  const setUpdateBadgeMetadata = txTimelineContext.setUpdateBadgeMetadataTimeline;
  const addMethod = txTimelineContext.addMethod;

  if (!collection) return EmptyStepItem

  const err = startingCollection && collection ? validateBadgeMetadataUpdate(startingCollection.badgeMetadataTimeline, collection.badgeMetadataTimeline, startingCollection.collectionPermissions.canUpdateBadgeMetadata) : undefined;

  const canUpdateBadgeMetadataRes = getPermissionDetails(
    startingCollection ? castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(startingCollection.collectionPermissions.canUpdateBadgeMetadata ?? []) : [],
    TimedUpdateWithBadgeIdsPermissionUsedFlags,
    undefined,
    [{ start: 1n, end: getTotalNumberOfBadges(collection) }]
  );

  const toUpdateBadges = sortUintRangesAndMergeIfNecessary(canUpdateBadgeMetadataRes.dataSource.filter(x => !x.forbidden).map(x => x.badgeIds ?? []).flat());


  return {
    title: 'Set Badge Metadata',
    description: <>Customize each individual badge in the collection.</>,
    node: <UpdateSelectWrapper
      updateFlag={canUpdateBadgeMetadata}
      setUpdateFlag={setUpdateBadgeMetadata}
      jsonPropertyPath='badgeMetadataTimeline'
      permissionName='canUpdateBadgeMetadata'
      disableJson
      node={<InformationDisplayCard title='Badge Metadata'>{
        collection && <>
          <ErrDisplay err={err} />
          <MetadataForm badgeIds={toUpdateBadges} />
        </>
      }</InformationDisplayCard>}
    />,
    disabled: !collection || (addMethod === MetadataAddMethod.Manual && (collection.cachedBadgeMetadata.length == 0))
      || (addMethod === MetadataAddMethod.UploadUrl && ((collection.collectionMetadataTimeline.length == 0) || (collection.badgeMetadataTimeline.length == 0)))
      // || (addMethod === MetadataAddMethod.CSV && !(collectionMetadata?.name))
      || !!err,
  }
}