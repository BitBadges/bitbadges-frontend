import { Divider, Typography } from "antd";
import { MetadataAddMethod, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, validateCollectionMetadataUpdate } from "bitbadgesjs-utils";
import { CollectionHeader } from "../../badges/CollectionHeader";
import { MetadataForm } from "../form-items/MetadataForm";

import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { PermissionIcon, } from "../../collection-page/PermissionsInfo";
import { ToolIcon } from "../../display/ToolIcon";
import { MSG_PREVIEW_ID } from "../TxTimeline";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function SetCollectionMetadataStepItem(
  addMethod: MetadataAddMethod,
  canUpdateCollectionMetadata: boolean,
  setCanUpdateCollectionMetadata: (canUpdateCollectionMetadata: boolean) => void,
  existingCollectionId?: bigint,
  hideCollectionSelect?: boolean,
  hideBadgeSelect?: boolean,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const collectionMetadata = collection?.cachedCollectionMetadata;
  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;

  const err = existingCollection && collection ? validateCollectionMetadataUpdate(existingCollection.collectionMetadataTimeline, collection.collectionMetadataTimeline, existingCollection.collectionPermissions.canUpdateCollectionMetadata) : undefined;

  return {
    title: 'Set Collection Metadata',
    description: <>{'Provide details about the collection you are creating.'}

      {existingCollectionId ? <> <br /><br />{`Current Permission - Can Update Collection Metadata?: `}
        {
          PermissionIcon(
            castTimedUpdatePermissionToUniversalPermission(existingCollection?.collectionPermissions.canUpdateCollectionMetadata ?? []), '', TimedUpdatePermissionUsedFlags
          )
        }
      </> : <></>}
      <br />
      {existingCollectionId && addMethod === MetadataAddMethod.UploadUrl ? <> {`Current Permission - Can Update Badge Metadata?: `}
        {
          PermissionIcon(
            castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(existingCollection?.collectionPermissions.canUpdateBadgeMetadata ?? []), '', TimedUpdateWithBadgeIdsPermissionUsedFlags
          )
        }
      </> : <></>}
    </>,

    node: <UpdateSelectWrapper
      updateFlag={canUpdateCollectionMetadata}
      setUpdateFlag={setCanUpdateCollectionMetadata}
      existingCollectionId={existingCollectionId}
      node={<>{




        collection && collectionMetadata && <div>
          {err &&
            <div style={{ color: 'red', textAlign: 'center' }}>
              <b>Error: </b>{err.message}
              <br />
              <p>Please resolve this error before continuing.</p>
              <br />
              <p>This error may have happened because this collection used a tool other than this website to be created or updated. If this is the case, certain features may not be fully supported, and we apologize. We are working on 100% compatibility.</p>

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
            startId={existingCollection ? getTotalNumberOfBadges(existingCollection) : 1n}
            endId={collection ? getTotalNumberOfBadges(collection) : 1n}
            toBeFrozen={collection?.collectionPermissions.canUpdateBadgeMetadata.length > 0}
          />
          <Divider />
          {addMethod === MetadataAddMethod.Manual && <>
            <Typography.Text strong style={{ fontSize: 20 }} className='primary-text'>Useful Tools</Typography.Text>
            <div className='flex'>
              <ToolIcon name="Sketch.io" />
              <ToolIcon name="Excalidraw" />
            </div>
          </>}
        </div>
      }</>
      }
    />,
    disabled: !collection || (addMethod === MetadataAddMethod.Manual && !(collectionMetadata?.name))
      || (addMethod === MetadataAddMethod.UploadUrl && ((!hideCollectionSelect && collection.collectionMetadataTimeline.length == 0) || (!hideBadgeSelect && collection.badgeMetadataTimeline.length == 0)))
      || (addMethod === MetadataAddMethod.CSV && !(collectionMetadata?.name))
      || !!err,
  }
}