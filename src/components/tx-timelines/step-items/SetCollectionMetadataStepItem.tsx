import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { populateFieldsOfOtherBadges } from "bitbadges-sdk";
import { GetPermissions } from "bitbadges-sdk";
import { BadgeMetadata, BadgeMetadataMap, BitBadgeCollection, IdRange, MetadataAddMethod } from "bitbadges-sdk";
import { CollectionHeader } from "../../badges/CollectionHeader";
import { MetadataForm } from "../form-items/MetadataForm";

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
    updateMetadataForBadgeIdsDirectlyFromUriIfAbsent?: (badgeIds: number[]) => void,
    hideCollectionSelect?: boolean
) {
    return {
        title: 'Set Collection Metadata',
        description: `Provide details about the badge collection.`,
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
                    console.log("SETTING IN COLLECTION");
                    individualBadgeMetadata = populateFieldsOfOtherBadges(individualBadgeMetadata, badgeIds, key, value, metadataToSet);
                    setIndividualBadgeMetadata(individualBadgeMetadata);
                }}
            />
        </div>,
        disabled: (addMethod === MetadataAddMethod.Manual && !(collectionMetadata?.name))
            || (addMethod === MetadataAddMethod.UploadUrl && (!(newCollectionMsg.collectionUri) || !(newCollectionMsg.badgeUris.length)))
            || (addMethod === MetadataAddMethod.CSV && !(collectionMetadata?.name))
    }
}