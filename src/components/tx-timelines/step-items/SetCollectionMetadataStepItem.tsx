import { Divider, Typography } from "antd";
import { MetadataAddMethod } from "bitbadgesjs-utils";
import { CollectionHeader } from "../../badges/CollectionHeader";
import { MetadataForm } from "../form-items/MetadataForm";

import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { ToolIcon } from "../../display/ToolIcon";
import { MSG_PREVIEW_ID } from "../TxTimeline";

export function SetCollectionMetadataStepItem(
  addMethod: MetadataAddMethod,
  existingCollectionId?: bigint,
  hideCollectionSelect?: boolean,
  hideBadgeSelect?: boolean,
) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);
  const collectionMetadata = collection?.collectionMetadata;
  const existingCollection = existingCollectionId ? collections.getCollection(existingCollectionId) : undefined;


  return {
    title: 'Set Collection Metadata',
    description: `Provide details about the collection you are creating.`,
    node: collection && collectionMetadata && <div>

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
        startId={existingCollection?.nextBadgeId || 1n}
        endId={collection.nextBadgeId - 1n}
        toBeFrozen={!collection?.permissions.CanUpdateMetadataUris}
      />
      <Divider />
      {addMethod === MetadataAddMethod.Manual && <>
        <Typography.Text strong style={{ fontSize: 20 }} className='primary-text'>Useful Tools</Typography.Text>
        <div className='flex'>
          <ToolIcon name="Sketch.io" />
        </div>
      </>}
    </div>,
    disabled: !collection || (addMethod === MetadataAddMethod.Manual && !(collectionMetadata?.name))
      || (addMethod === MetadataAddMethod.UploadUrl && ((!hideCollectionSelect && !collection.collectionUri) || (!hideBadgeSelect && !collection.badgeUris.length)))
      || (addMethod === MetadataAddMethod.CSV && !(collectionMetadata?.name))
  }
}