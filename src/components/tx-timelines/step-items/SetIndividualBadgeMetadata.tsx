import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { useState } from "react";
import { getMetadataForBadgeId } from "bitbadgesjs-utils";
import { getBlankBalance } from "bitbadgesjs-utils";
import { populateFieldsOfOtherBadges, updateMetadataMap } from "bitbadgesjs-utils";
import { BadgeMetadata, BadgeMetadataMap, BitBadgeCollection, IdRange, MetadataAddMethod } from "bitbadgesjs-utils";
import { PRIMARY_TEXT } from '../../../constants';
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay";
import { MetadataForm } from "../form-items/MetadataForm";

export function SetIndividualBadgeMetadataStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (msg: MessageMsgNewCollection) => void,
    collection: BitBadgeCollection,
    individualBadgeMetadata: BadgeMetadataMap,
    setIndividualBadgeMetadata: (metadata: BadgeMetadataMap) => void,
    collectionMetadata: BadgeMetadata,
    addMethod: MetadataAddMethod,
    existingCollection?: BitBadgeCollection,
    isAddBadgeTx?: boolean
) {
    const [disabled, setDisabled] = useState(false);
    const [id, setId] = useState(existingCollection?.nextBadgeId || 1);


    return {
        title: 'Set Badge Metadata',
        description: !collection.permissions.CanUpdateUris && isAddBadgeTx && 'Note that once created, the metadata for these badges will be frozen and cannot be edited.',
        node: <>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ maxWidth: 700, color: PRIMARY_TEXT }}>
                    <BadgeAvatarDisplay
                        collection={{
                            ...collection,
                            collectionMetadata: collectionMetadata,
                            badgeMetadata: individualBadgeMetadata
                        }}
                        userBalance={getBlankBalance()}
                        badgeIds={[
                            {
                                start: existingCollection?.nextBadgeId || 1,
                                end: collection.nextBadgeId - 1,
                            }
                        ]}
                        selectedId={id}
                        size={50}
                        showIds={true}
                    />
                </div>
            </div>
            <hr />
            <br />

            <MetadataForm
                id={id}
                setId={setId}
                collection={{
                    ...collection,
                    collectionMetadata: collectionMetadata,
                    badgeMetadata: individualBadgeMetadata
                }}
                startId={existingCollection?.nextBadgeId || 1}
                endId={collection.nextBadgeId - 1}
                toBeFrozen={!collection.permissions.CanUpdateUris}
                metadata={getMetadataForBadgeId(id, individualBadgeMetadata) || {} as BadgeMetadata}
                setMetadata={(metadata: BadgeMetadata) => {
                    setDisabled(true);
                    console.log("SETTING IN INDIVIDUAL BADGE METADATA STEP ITEM");
                    console.log(metadata);
                    console.time("SET");
                    individualBadgeMetadata = updateMetadataMap(individualBadgeMetadata, metadata, { start: id, end: id }, 'Manual');
                    console.log(individualBadgeMetadata);
                    setIndividualBadgeMetadata(individualBadgeMetadata);
                    setDisabled(false);
                    console.timeEnd("SET");
                }}
                populateOtherBadges={(badgeIds: IdRange[], key: string, value: any, metadataToSet?: BadgeMetadata) => {
                    individualBadgeMetadata = populateFieldsOfOtherBadges(individualBadgeMetadata, badgeIds, key, value, metadataToSet);
                    setIndividualBadgeMetadata(individualBadgeMetadata);
                }}
                addMethod={addMethod}
                setNewCollectionMsg={setNewCollectionMsg}
                newCollectionMsg={newCollectionMsg}
            />
        </>,
        disabled: !(getMetadataForBadgeId(id, individualBadgeMetadata)?.name) || disabled
    }
}