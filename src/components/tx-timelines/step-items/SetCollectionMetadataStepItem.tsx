import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { populateFieldsOfOtherBadges } from "bitbadgesjs-utils";
import { GetPermissions } from "bitbadgesjs-utils";
import { BadgeMetadata, BadgeMetadataMap, BitBadgeCollection, IdRange, MetadataAddMethod } from "bitbadgesjs-utils";
import { CollectionHeader } from "../../badges/CollectionHeader";
import { MetadataForm } from "../form-items/MetadataForm";
import { Divider, Typography } from "antd";
import { PRIMARY_TEXT } from "../../../constants";
import { ToolIcon } from "../../display/ToolIcon";

export function SetCollectionMetadataStepItem(
  newCollectionMsg: MessageMsgNewCollection,
  setNewCollectionMsg: (msg: MessageMsgNewCollection) => void,
  addMethod: MetadataAddMethod,
  collectionMetadata: BadgeMetadata,
  setCollectionMetadata: (metadata: BadgeMetadata) => void,
  individualBadgeMetadata: BadgeMetadataMap,
  setIndividualBadgeMetadata: (metadata: BadgeMetadataMap) => void,
  simulatedCollection: BitBadgeCollection,
  existingCollection?: BitBadgeCollection,
  updateMetadataForBadgeIdsDirectlyFromUriIfAbsent?: (badgeIds: number[]) => Promise<void>,
  hideCollectionSelect?: boolean,
  hideBadgeSelect?: boolean,
) {
  return {
    title: 'Set Collection Metadata',
    description: `Provide details about the collection you are creating.`,
    node: <div>

      {addMethod === MetadataAddMethod.Manual &&
        <div>
          <div>
            <br />
            <br />
            <CollectionHeader metadata={collectionMetadata} />
          </div>
        </div>
      }

      <MetadataForm
        collection={{
          ...simulatedCollection,
          collectionMetadata: collectionMetadata,
          badgeMetadata: individualBadgeMetadata
        }}
        hideCollectionSelect={hideCollectionSelect}
        hideBadgeSelect={hideBadgeSelect}
        updateMetadataForBadgeIdsDirectlyFromUriIfAbsent={updateMetadataForBadgeIdsDirectlyFromUriIfAbsent}
        addMethod={addMethod}
        metadata={collectionMetadata}
        startId={existingCollection?.nextBadgeId || 1}
        endId={simulatedCollection.nextBadgeId - 1}
        setMetadata={setCollectionMetadata as any}
        setNewCollectionMsg={setNewCollectionMsg}
        newCollectionMsg={newCollectionMsg}
        toBeFrozen={!GetPermissions(newCollectionMsg.permissions).CanUpdateUris}
        populateOtherBadges={(badgeIds: IdRange[], key: string, value: any, metadataToSet?: BadgeMetadata) => {
          individualBadgeMetadata = populateFieldsOfOtherBadges(individualBadgeMetadata, badgeIds, key, value, metadataToSet);
          setIndividualBadgeMetadata(individualBadgeMetadata);
        }}
      />
      <Divider />
      {addMethod === MetadataAddMethod.Manual && <>
        <Typography.Text strong style={{ fontSize: 20, color: PRIMARY_TEXT }}>Useful Tools</Typography.Text>
        <div style={{ display: 'flex' }}>
          <ToolIcon name="Sketch.io" />
        </div>
      </>}
    </div>,
    disabled: (addMethod === MetadataAddMethod.Manual && !(collectionMetadata?.name))
      || (addMethod === MetadataAddMethod.UploadUrl && ((!hideCollectionSelect && !newCollectionMsg.collectionUri) || (!hideBadgeSelect && !newCollectionMsg.badgeUris.length)))
      || (addMethod === MetadataAddMethod.CSV && !(collectionMetadata?.name))
  }
}