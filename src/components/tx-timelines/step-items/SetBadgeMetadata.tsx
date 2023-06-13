import { Divider, Typography } from "antd";
import { MetadataAddMethod } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay";
import { ToolIcon } from "../../display/ToolIcon";
import { MSG_PREVIEW_ID } from "../TxTimeline";
import { MetadataForm } from "../form-items/MetadataForm";

export function SetBadgeMetadataStepItem(
  addMethod: MetadataAddMethod,
  existingCollectionId?: bigint,
  isAddBadgeTx?: boolean
) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);
  const existingCollection = existingCollectionId ? collections.getCollection(existingCollectionId) : undefined;

  return {
    title: 'Set Badge Metadata',
    description: !collection?.permissions.CanUpdateMetadataUris && isAddBadgeTx && 'Note that once created, the metadata for these badges will be frozen and cannot be edited.',
    node: collection && <>
      <div className='flex-center'>
        <div style={{ maxWidth: 700 }} className='primary-text'>
          <BadgeAvatarDisplay
            collectionId={MSG_PREVIEW_ID}
            badgeIds={[
              {
                start: existingCollection?.nextBadgeId || 1n,
                end: collection.nextBadgeId - 1n,
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
        startId={existingCollection?.nextBadgeId || 1n}
        endId={collection.nextBadgeId - 1n}
        toBeFrozen={!collection?.permissions.CanUpdateMetadataUris}
        addMethod={addMethod}
      />
      <Divider />
      <Typography.Text strong style={{ fontSize: 20 }} className='primary-text'>Useful Tools</Typography.Text>
      <div style={{ display: 'flex' }}>
        <ToolIcon name="Sketch.io" />
      </div>
    </>,
    disabled: !collection
  }
}