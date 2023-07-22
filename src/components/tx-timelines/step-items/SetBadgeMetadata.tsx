import { Divider, Typography } from "antd";
import { MetadataAddMethod } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay";
import { ToolIcon } from "../../display/ToolIcon";
import { MSG_PREVIEW_ID } from "../TxTimeline";
import { MetadataForm } from "../form-items/MetadataForm";

export function SetBadgeMetadataStepItem(
  addMethod: MetadataAddMethod,
  existingCollectionId?: bigint
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[`${MSG_PREVIEW_ID}`];
  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;


  console.log("RERENDER", collection, collection ? getTotalNumberOfBadges(collection) : "");
  return {
    title: 'Set Badge Metadata',
    description: '',
    // TODO: description: !collection?.collectionPermissions.CanUpdateMetadataUris && isAddBadgeTx && 'Note that once created, the metadata for these badges will be frozen and cannot be edited.',
    node: collection && <>
      <div className='flex-center'>
        <div style={{ maxWidth: 700 }} className='primary-text'>
          <BadgeAvatarDisplay
            collectionId={MSG_PREVIEW_ID}
            badgeIds={[
              {
                start: existingCollection ? getTotalNumberOfBadges(existingCollection) + 1n : 1n,
                end: collection ? getTotalNumberOfBadges(collection) : 1n
              }
            ]}
            size={50}
            showIds={true}
          />
        </div>
      </div>
      <hr />
      <br />
      <MetadataForm
        collectionId={MSG_PREVIEW_ID}
        startId={existingCollection ? getTotalNumberOfBadges(existingCollection) + 1n : 1n}
        endId={collection ? getTotalNumberOfBadges(collection) : 1n}
        toBeFrozen={collection?.collectionPermissions.canUpdateBadgeMetadata.length > 0}
        addMethod={addMethod}
      />
      <Divider />
      <Typography.Text strong style={{ fontSize: 20 }} className='primary-text'>Useful Tools</Typography.Text>
      <div style={{ display: 'flex' }}>
        <ToolIcon name="Sketch.io" />
        <ToolIcon name="Excalidraw" />
      </div>
    </>,
    disabled: !collection
  }
}