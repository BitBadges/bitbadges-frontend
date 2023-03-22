import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { useState } from "react";
import { getMetadataForBadgeId } from "../../../bitbadges-api/badges";
import { getBlankBalance } from "../../../bitbadges-api/balances";
import { InsertRangeToIdRanges, RemoveIdsFromIdRange, SearchIdRangesForId } from "../../../bitbadges-api/idRanges";
import { BadgeMetadata, BadgeMetadataMap, BitBadgeCollection, IdRange, MetadataAddMethod } from "../../../bitbadges-api/types";
import { PRIMARY_TEXT } from "../../../constants";
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
                        hideModalBalance
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
            {/* 
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Button style={{ backgroundColor: 'transparent', color: PRIMARY_TEXT, margin: 20 }}
                    onClick={}>Populate All with Collection Metadata</Button>
                <Button
                    style={{ backgroundColor: 'transparent', color: PRIMARY_TEXT, margin: 20 }}
                    onClick={}>{`Populate All with Badge ID ${id}'s Metadata`}</Button>
            </div> */}


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
                metadata={getMetadataForBadgeId(id, individualBadgeMetadata)}
                setMetadata={(metadata: BadgeMetadata) => {
                    setDisabled(true);

                    console.time("SET");
                    let keys = Object.keys(individualBadgeMetadata);
                    let values = Object.values(individualBadgeMetadata);
                    for (let i = 0; i < keys.length; i++) {
                        const res = SearchIdRangesForId(id, values[i].badgeIds)
                        const idx = res[0]
                        const found = res[1]

                        if (found) {
                            values[i].badgeIds = [...values[i].badgeIds.slice(0, idx), ...RemoveIdsFromIdRange({ start: id, end: id }, values[i].badgeIds[idx]), ...values[i].badgeIds.slice(idx + 1)]

                        }
                    }

                    let metadataExists = false;
                    for (let i = 0; i < keys.length; i++) {
                        if (JSON.stringify(values[i].metadata) === JSON.stringify(metadata)) {
                            metadataExists = true;
                            values[i].badgeIds = values[i].badgeIds.length > 0 ? InsertRangeToIdRanges({ start: id, end: id }, values[i].badgeIds) : [{ start: id, end: id }];
                        }
                    }

                    let currIdx = 0;
                    individualBadgeMetadata = {};
                    for (let i = 0; i < keys.length; i++) {
                        if (values[i].badgeIds.length === 0) {
                            continue;
                        }
                        individualBadgeMetadata[currIdx] = values[i];
                        currIdx++;
                    }

                    if (!metadataExists) {

                        individualBadgeMetadata[Object.keys(individualBadgeMetadata).length] = {
                            metadata: metadata,
                            badgeIds: [{
                                start: id,
                                end: id,
                            }],
                        }
                    }

                    setIndividualBadgeMetadata(individualBadgeMetadata);
                    setDisabled(false);
                    console.timeEnd("SET");
                }}
                populateOtherBadges={(badgeIds: IdRange[], key: string, value: any, metadataToSet?: BadgeMetadata) => {
                    for (const badgeIdRange of badgeIds) {
                        for (let id = badgeIdRange.start; id <= badgeIdRange.end; id++) {
                            let newMetadata = {} as BadgeMetadata;
                            let keys = Object.keys(individualBadgeMetadata);
                            let values = Object.values(individualBadgeMetadata);
                            const idRangeToUpdate = { start: id, end: id };
                            for (let i = 0; i < values.length; i++) {
                                const res = SearchIdRangesForId(id, values[i].badgeIds)
                                const idx = res[0]
                                const found = res[1]
                                if (found) {
                                    for (let j = id + 1; j <= badgeIdRange.end; j++) {
                                        const res = SearchIdRangesForId(j, values[i].badgeIds)
                                        const found = res[1]
                                        if (found) {
                                            idRangeToUpdate.end = j;
                                            id = j;
                                        } else {
                                            break;
                                        }
                                    }
                                    values[i].badgeIds = [...values[i].badgeIds.slice(0, idx), ...RemoveIdsFromIdRange(idRangeToUpdate, values[i].badgeIds[idx]), ...values[i].badgeIds.slice(idx + 1)]

                                    newMetadata = { ...values[i].metadata, [key]: value };
                                    if (metadataToSet) {
                                        newMetadata = { ...metadataToSet };
                                    }

                                    break;
                                }
                            }

                            let metadata = newMetadata;

                            let metadataExists = false;
                            for (let i = 0; i < keys.length; i++) {
                                if (JSON.stringify(values[i].metadata) === JSON.stringify(metadata)) {
                                    metadataExists = true;
                                    values[i].badgeIds = values[i].badgeIds.length > 0 ? InsertRangeToIdRanges(idRangeToUpdate, values[i].badgeIds) : [idRangeToUpdate];
                                }
                            }

                            let currIdx = 0;
                            individualBadgeMetadata = {};
                            for (let i = 0; i < keys.length; i++) {
                                if (values[i].badgeIds.length === 0) {
                                    continue;
                                }
                                individualBadgeMetadata[currIdx] = values[i];
                                currIdx++;
                            }

                            if (!metadataExists) {
                                individualBadgeMetadata[Object.keys(individualBadgeMetadata).length] = {
                                    metadata: { ...metadata },
                                    badgeIds: [idRangeToUpdate],
                                }
                            }
                        }
                    }

                    setIndividualBadgeMetadata(individualBadgeMetadata);
                }}
                addMethod={addMethod}
                setNewCollectionMsg={setNewCollectionMsg}
                newCollectionMsg={newCollectionMsg}
            />
        </>,
        disabled: !(getMetadataForBadgeId(id, individualBadgeMetadata).name) || disabled
    }
}