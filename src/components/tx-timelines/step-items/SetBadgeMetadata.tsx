import { Divider, Typography } from "antd";
import { MetadataAddMethod, TimedUpdateWithBadgeIdsPermissionUsedFlags, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, validateBadgeMetadataUpdate } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay";
import { PermissionIcon, } from "../../collection-page/PermissionsInfo";
import { ToolIcon } from "../../display/ToolIcon";
import { MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
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

  const err = existingCollection && collection ? validateBadgeMetadataUpdate(existingCollection.badgeMetadataTimeline, collection.badgeMetadataTimeline, existingCollection.collectionPermissions.canUpdateBadgeMetadata) : undefined;


  console.log("RERENDER 12120")
  return {
    title: 'Set Badge Metadata',
    // description: '',
    // TODO: description: !collection?.collectionPermissions.CanUpdateMetadataUris && isAddBadgeTx && 'Note that once created, the metadata for these badges will be frozen and cannot be edited.',

    description: <>{''}

      {existingCollectionId ? <> <br /><br />{`Current Permission - Can Update Badge Metadata?: `}
        {
          PermissionIcon(
            castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(existingCollection?.collectionPermissions.canUpdateBadgeMetadata ?? []), '', TimedUpdateWithBadgeIdsPermissionUsedFlags
          )
        }
      </> : <></>}

    </>,
    node: <UpdateSelectWrapper
      updateFlag={canUpdateBadgeMetadata}
      setUpdateFlag={setUpdateBadgeMetadata}
      existingCollectionId={existingCollectionId}
      node={<>{



        collection && <>
          {err &&
            <div style={{ color: 'red', textAlign: 'center' }}>
              <b>Error: </b>{err.message}
              <br />
              <p>Please resolve this error before continuing.</p>
              <br />
              <p>This error may have happened because this collection used a tool other than this website to be created or updated. If this is the case, certain features may not be fully supported, and we apologize. We are working on 100% compatibility.</p>

              <Divider />
            </div>}
          {addMethod != MetadataAddMethod.UploadUrl && <>
            <div className='flex-center full-width'>

              <div className='primary-text full-width'>
                <BadgeAvatarDisplay
                  collectionId={MSG_PREVIEW_ID}
                  badgeIds={[
                    {
                      start: 1n,
                      end: collection ? getTotalNumberOfBadges(collection) : 1n
                    }
                  ]}
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
            startId={1n}
            endId={collection ? getTotalNumberOfBadges(collection) : 1n}
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