import { Divider, Typography } from "antd";
import { MetadataAddMethod } from "bitbadgesjs-utils";
import { CollectionHeader } from "../../badges/CollectionHeader";
import { MetadataForm } from "../form-items/MetadataForm";

import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { ToolIcon } from "../../display/ToolIcon";
import { MSG_PREVIEW_ID } from "../TxTimeline";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";

export function SetCollectionMetadataStepItem(
  addMethod: MetadataAddMethod,
  existingCollectionId?: bigint,
  hideCollectionSelect?: boolean,
  hideBadgeSelect?: boolean,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const collectionMetadata = collection?.collectionMetadata;
  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;


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
    </div>,
    disabled: !collection || (addMethod === MetadataAddMethod.Manual && !(collectionMetadata?.name))
      || (addMethod === MetadataAddMethod.UploadUrl && ((!hideCollectionSelect && collection.collectionMetadataTimeline.length == 0) || (!hideBadgeSelect && collection.badgeMetadataTimeline.length == 0)))
      || (addMethod === MetadataAddMethod.CSV && !(collectionMetadata?.name))
  }
}