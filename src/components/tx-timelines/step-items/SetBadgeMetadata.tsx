import { BitBadgesCollection, MetadataAddMethod, TimedUpdateWithBadgeIdsPermissionUsedFlags, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { useState } from "react";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";

import { useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { neverHasManager } from "../../../bitbadges-api/utils/manager";
import { getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { MetadataForm } from "../form-items/MetadataForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export const getBadgesWithUpdatableMetadata = (collection: BitBadgesCollection<bigint>, startingCollection: BitBadgesCollection<bigint> | undefined, currentCollection = false) => {
  const collectionToCheck = currentCollection ? collection : startingCollection;
  if (!collectionToCheck) return [];

  const canUpdateBadgeMetadataRes = getPermissionDetails(
    collectionToCheck ? castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(collectionToCheck.collectionPermissions.canUpdateBadgeMetadata ?? []) : [],
    TimedUpdateWithBadgeIdsPermissionUsedFlags,
    neverHasManager(collectionToCheck),
    [{ start: 1n, end: getTotalNumberOfBadges(collection) }]
  );

  const toUpdateBadges = sortUintRangesAndMergeIfNecessary(canUpdateBadgeMetadataRes.dataSource.filter(x => !x.forbidden).map(x => x.badgeIds ?? []).flat(), true);
  return toUpdateBadges
}

export function SetBadgeMetadataStepItem() {

  const collection = useCollection(NEW_COLLECTION_ID);
  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const canUpdateBadgeMetadata = txTimelineContext.updateBadgeMetadataTimeline;
  const setUpdateBadgeMetadata = txTimelineContext.setUpdateBadgeMetadataTimeline;
  const addMethod = txTimelineContext.badgeAddMethod;
  const setAddMethod = txTimelineContext.setBadgeAddMethod;

  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem

  const toUpdateBadges = getBadgesWithUpdatableMetadata(collection, startingCollection);

  return {
    title: 'Set Badge Metadata',
    description: <>Customize each individual badge in the collection.</>,
    node: <UpdateSelectWrapper
      err={err}
      setErr={(err) => { setErr(err) }}
      updateFlag={canUpdateBadgeMetadata}
      setUpdateFlag={setUpdateBadgeMetadata}
      jsonPropertyPath='badgeMetadataTimeline'
      permissionName='canUpdateBadgeMetadata'
      disableJson
      node={<div>
        {
          collection && <>
            <MetadataForm
              badgeIds={toUpdateBadges}
              addMethod={addMethod} setAddMethod={setAddMethod} />
          </>
        }
      </div>}
    />,
    disabled: !collection || (addMethod === MetadataAddMethod.Manual && (collection.cachedBadgeMetadata.length == 0))
      || (addMethod === MetadataAddMethod.UploadUrl && ((collection.collectionMetadataTimeline.length == 0) || (collection.badgeMetadataTimeline.length == 0)))
      || !!err,
  }
}