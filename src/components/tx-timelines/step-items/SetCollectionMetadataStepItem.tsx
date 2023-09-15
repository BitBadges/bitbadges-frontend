import { Divider, Typography } from "antd";
import { MetadataAddMethod, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, removeUintRangeFromUintRange, sortUintRangesAndMergeIfNecessary, validateCollectionMetadataUpdate } from "bitbadgesjs-utils";
import { CollectionHeader } from "../../badges/CollectionHeader";
import { MetadataForm } from "../form-items/MetadataForm";

import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { PermissionIcon, getPermissionDataSource, } from "../../collection-page/PermissionsInfo";
import { ToolIcon } from "../../display/ToolIcon";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function SetCollectionMetadataStepItem(
  addMethod: MetadataAddMethod,
  canUpdateCollectionMetadata: boolean,
  setCanUpdateCollectionMetadata: (canUpdateCollectionMetadata: boolean) => void,
  existingCollectionId?: bigint,
  hideCollectionSelect?: boolean,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const collectionMetadata = collection?.cachedCollectionMetadata;
  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;

  const err = existingCollection && collection ? validateCollectionMetadataUpdate(existingCollection.collectionMetadataTimeline, collection.collectionMetadataTimeline, existingCollection.collectionPermissions.canUpdateCollectionMetadata) : undefined;

  if (!collection) return EmptyStepItem

  let canUpdateBadgeMetadataRes = getPermissionDataSource(
    existingCollection ? castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(existingCollection.collectionPermissions.canUpdateBadgeMetadata ?? []) : [],
    TimedUpdateWithBadgeIdsPermissionUsedFlags
  );
  let maxBadgeId = getTotalNumberOfBadges(collection);
  let toUpdateBadges = canUpdateBadgeMetadataRes.dataSource.filter(x => !x.forbidden).map(x => {
    const [remaining, removed] = removeUintRangeFromUintRange([{ start: 1n, end: maxBadgeId }], x.badgeIds ?? []);

    return removed;
  }).flat();
  toUpdateBadges = sortUintRangesAndMergeIfNecessary(toUpdateBadges);


  return {
    title: 'Set Collection Metadata',
    description: <>{'Provide details about the collection you are creating.'}

      <br />
      {existingCollectionId && addMethod === MetadataAddMethod.UploadUrl ? <> {`Current Permission - Can Update Badge Metadata?: `}
        {
          PermissionIcon(
            "canUpdateBadgeMetadata",
            castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(existingCollection?.collectionPermissions.canUpdateBadgeMetadata ?? []), '', TimedUpdateWithBadgeIdsPermissionUsedFlags
          )
        }
      </> : <></>}
    </>,

    node: <UpdateSelectWrapper
      updateFlag={canUpdateCollectionMetadata}
      setUpdateFlag={setCanUpdateCollectionMetadata}
      existingCollectionId={existingCollectionId}
      jsonPropertyPath='collectionMetadataTimeline'
      permissionName='canUpdateCollectionMetadata'
      disableJson
      node={<>{
        collection && collectionMetadata && <div>
          {err &&
            <div style={{ color: 'red', textAlign: 'center' }}>
              <b>Error: </b>You are attempting to update a previously frozen value.
              <br />

              <br />


              <Divider />
            </div>}

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
            collectionId={MSG_PREVIEW_ID}
            hideCollectionSelect={hideCollectionSelect}
            isCollectionSelect
            addMethod={addMethod}
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