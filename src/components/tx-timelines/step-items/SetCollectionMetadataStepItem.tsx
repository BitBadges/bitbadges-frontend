import { Divider, Typography } from "antd";
import { MetadataAddMethod, TimedUpdateWithBadgeIdsPermissionUsedFlags, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, sortUintRangesAndMergeIfNecessary, validateCollectionMetadataUpdate } from "bitbadgesjs-utils";
import { CollectionHeader } from "../../badges/CollectionHeader";
import { MetadataForm } from "../form-items/MetadataForm";

import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { PermissionIcon, getPermissionDetails, } from "../../collection-page/PermissionsInfo";
import { ToolIcon } from "../../display/ToolIcon";
import { ErrDisplay } from "../form-items/ErrDisplay";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function SetCollectionMetadataStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const collectionMetadata = collection?.cachedCollectionMetadata;
  const txTimelineContext = useTxTimelineContext();
  const startingCollection = txTimelineContext.startingCollection;
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const canUpdateCollectionMetadata = txTimelineContext.updateCollectionMetadataTimeline;
  const setCanUpdateCollectionMetadata = txTimelineContext.setUpdateCollectionMetadataTimeline;
  const addMethod = txTimelineContext.addMethod;
  const hideCollectionSelect = false;

  const err = startingCollection && collection ? validateCollectionMetadataUpdate(startingCollection.collectionMetadataTimeline, collection.collectionMetadataTimeline, startingCollection.collectionPermissions.canUpdateCollectionMetadata) : undefined;

  if (!collection) return EmptyStepItem

  const canUpdateBadgeMetadataRes = getPermissionDetails(
    startingCollection ? castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(startingCollection.collectionPermissions.canUpdateBadgeMetadata ?? []) : [],
    TimedUpdateWithBadgeIdsPermissionUsedFlags,
    undefined,
    [{ start: 1n, end: getTotalNumberOfBadges(collection) }]
  );

  const toUpdateBadges = sortUintRangesAndMergeIfNecessary(canUpdateBadgeMetadataRes.dataSource.filter(x => !x.forbidden).map(x => x.badgeIds ?? []).flat());

  return {
    title: 'Set Collection Metadata',
    description: <>{'Provide details about the collection you are creating.'}

      <br />
      {existingCollectionId && addMethod === MetadataAddMethod.UploadUrl ? <> {`Current Permission - Can Update Badge Metadata?: `}
        {
          PermissionIcon(
            "canUpdateBadgeMetadata",
            castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(startingCollection?.collectionPermissions.canUpdateBadgeMetadata ?? []), TimedUpdateWithBadgeIdsPermissionUsedFlags
          )
        }
      </> : <></>}
    </>,

    node: <UpdateSelectWrapper
      updateFlag={canUpdateCollectionMetadata}
      setUpdateFlag={setCanUpdateCollectionMetadata}
      jsonPropertyPath='collectionMetadataTimeline'
      permissionName='canUpdateCollectionMetadata'
      disableJson
      node={<>{
        collection && collectionMetadata && <div>
          <ErrDisplay err={err} />

          {addMethod === MetadataAddMethod.Manual &&
            <div>
              <div>
                <br />
                <br />
                <CollectionHeader collectionId={MSG_PREVIEW_ID} />
              </div>
            </div>
          }

          <MetadataForm
            hideCollectionSelect={hideCollectionSelect}
            isCollectionSelect
            badgeIds={toUpdateBadges}
          />
          <Divider />
          {addMethod === MetadataAddMethod.Manual && <>
            <Typography.Text strong style={{ fontSize: 20 }} className='primary-text'>Useful Tools</Typography.Text>
            <div style={{ display: 'flex' }} className='flex-wrap'>
              <ToolIcon name="Sketch.io" />
              <ToolIcon name="Excalidraw" />
            </div>
          </>}
        </div>
      }</>
      }
    />,
    disabled: !collection || (addMethod === MetadataAddMethod.Manual && !(collectionMetadata?.name))
      || (addMethod === MetadataAddMethod.UploadUrl && ((collection.collectionMetadataTimeline.length == 0) || (collection.badgeMetadataTimeline.length == 0)))
      || (addMethod === MetadataAddMethod.CSV && !(collectionMetadata?.name))
      || !!err,
  }
}