import { Divider, Typography } from "antd";
import { MetadataAddMethod, TimedUpdateWithBadgeIdsPermissionUsedFlags, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, removeUintRangeFromUintRange, sortUintRangesAndMergeIfNecessary, validateBadgeMetadataUpdate } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay";
import { PermissionIcon, getPermissionDataSource, } from "../../collection-page/PermissionsInfo";
import { ToolIcon } from "../../display/ToolIcon";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { MetadataForm } from "../form-items/MetadataForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function SetBadgeMetadataStepItem(
  addMethod: MetadataAddMethod,
  canUpdateBadgeMetadata: boolean,
  setUpdateBadgeMetadata: (canUpdateBadgeMetadata: boolean) => void,
  existingCollectionId?: bigint
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[`${MSG_PREVIEW_ID}`];
  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;

  if (!collection) return EmptyStepItem

  const err = existingCollection && collection ? validateBadgeMetadataUpdate(existingCollection.badgeMetadataTimeline, collection.badgeMetadataTimeline, existingCollection.collectionPermissions.canUpdateBadgeMetadata) : undefined;

  let canUpdateBadgeMetadataRes = getPermissionDataSource(
    existingCollection ? castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(existingCollection.collectionPermissions.canUpdateBadgeMetadata ?? []) : [],
    TimedUpdateWithBadgeIdsPermissionUsedFlags
  );
  let maxBadgeId = getTotalNumberOfBadges(collection);
  let toUpdateBadges = canUpdateBadgeMetadataRes.dataSource.filter(x => !x.forbidden).map(x => {
    const [remaining, removed] = removeUintRangeFromUintRange([{ start: 1n, end: maxBadgeId }], x.badgeIds ?? []);

    return removed;
  }).flat();
  console.log(toUpdateBadges);
  toUpdateBadges = sortUintRangesAndMergeIfNecessary(toUpdateBadges);


  return {
    title: 'Set Badge Metadata',
    description: <></>,
    node: <UpdateSelectWrapper
      updateFlag={canUpdateBadgeMetadata}
      setUpdateFlag={setUpdateBadgeMetadata}
      existingCollectionId={existingCollectionId}
      jsonPropertyPath='badgeMetadataTimeline'
      permissionName='canUpdateBadgeMetadata'
      disableJson
      node={<>{



        collection && <>
          {err &&
            <div style={{ color: 'red', textAlign: 'center' }}>
              <b>Error: </b>You are attempting to update a previously frozen value.
              <br />

              <br />


              <Divider />
            </div>}
          {addMethod != MetadataAddMethod.UploadUrl && <>
            <div className='flex-center full-width'>

              <div className='primary-text full-width'>
                <BadgeAvatarDisplay
                  collectionId={MSG_PREVIEW_ID}
                  badgeIds={toUpdateBadges}
                  showIds={true}
                />
              </div>
            </div>
            <hr />
            <br />
          </>
          }

          <MetadataForm
            collectionId={MSG_PREVIEW_ID}
            badgeIds={toUpdateBadges}
            addMethod={addMethod}
          />
          <Divider />
          <Typography.Text strong style={{ fontSize: 20 }} className='primary-text'>Useful Tools</Typography.Text>
          <div style={{ display: 'flex' }} className='flex-wrap'>
            <ToolIcon name="Sketch.io" />
            <ToolIcon name="Excalidraw" />
          </div>
        </>
      }</>}
    />,
    disabled: !collection || (addMethod === MetadataAddMethod.Manual && (collection.cachedBadgeMetadata.length == 0))
      || (addMethod === MetadataAddMethod.UploadUrl && ((collection.collectionMetadataTimeline.length == 0) || (collection.badgeMetadataTimeline.length == 0)))
      // || (addMethod === MetadataAddMethod.CSV && !(collectionMetadata?.name))
      || !!err,
  }
}