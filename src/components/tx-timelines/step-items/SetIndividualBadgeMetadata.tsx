import { Divider, InputNumber, Typography } from "antd";
import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { useState } from "react";
import { getBlankBalance } from "../../../bitbadges-api/balances";
import { BadgeMetadata, BadgeMetadataMap, BitBadgeCollection, MetadataAddMethod } from "../../../bitbadges-api/types";
import { DEV_MODE, GO_MAX_UINT_64, PRIMARY_BLUE, PRIMARY_TEXT } from "../../../constants";
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay";
import { MetadataForm } from "../form-items/MetadataForm";
import { InsertRangeToIdRanges, RemoveIdsFromIdRange, SearchIdRangesForId } from "../../../bitbadges-api/idRanges";
import { getMetadataForBadgeId } from "../../../bitbadges-api/badges";

export function SetIndividualBadgeMetadataStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (msg: MessageMsgNewCollection) => void,
    collection: BitBadgeCollection,
    individualBadgeMetadata: BadgeMetadataMap,
    setIndividualBadgeMetadata: (metadata: BadgeMetadataMap) => void,
    collectionMetadata: BadgeMetadata,
    addMethod: MetadataAddMethod,
) {
    const [id, setId] = useState(1);
    const [disabled, setDisabled] = useState(false);

    return {
        title: 'Set Individual Badge Metadata',
        description: '',
        node: <>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {DEV_MODE && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography.Text style={{ color: PRIMARY_TEXT, fontSize: 22 }} strong>{Buffer.from(JSON.stringify({
                        collectionMetadata,
                        individualBadgeMetadata
                    })).length} Bytes</Typography.Text>
                    <Divider />
                </div>}

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
                                start: 1,
                                end: collection.nextBadgeId - 1,
                            }
                        ]}
                        selectedId={id}
                        size={40}
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: PRIMARY_TEXT }} >
                <div><b>Setting Metadata for Badge ID:{' '}</b></div>
                <InputNumber min={1} max={collection.nextBadgeId - 1}
                    value={id}
                    onChange={(e) => setId(e)}
                    style={{
                        marginLeft: 8,
                        backgroundColor: PRIMARY_BLUE,
                        color: PRIMARY_TEXT,
                    }}
                />
            </div>
            <MetadataForm
                id={id}
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
                        if (JSON.stringify(values[i].metadata) === JSON.stringify(metadata) && values[i].badgeIds.length > 0) {
                            metadataExists = true;
                            values[i].badgeIds = InsertRangeToIdRanges({ start: id, end: id }, values[i].badgeIds);
                        }
                    }

                    let currIdx = 0;
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
                populateAllWithCollectionMetadata={() => {
                    let newMetadata: BadgeMetadataMap = {
                        '1': {
                            metadata: { ...collectionMetadata },
                            badgeIds: [{
                                start: 1,
                                end: GO_MAX_UINT_64,
                            }],
                        },
                    };

                    console.log(newMetadata);

                    setIndividualBadgeMetadata(newMetadata);

                    return { ...collectionMetadata };
                }}
                populateAllWithCurrentMetadata={() => {
                    let currentMetadata = getMetadataForBadgeId(id, individualBadgeMetadata);

                    let newMetadata: BadgeMetadataMap = {
                        '1': {
                            metadata: { ...currentMetadata },
                            badgeIds: [{
                                start: 1,
                                end: GO_MAX_UINT_64,
                            }],
                        },
                    };

                    setIndividualBadgeMetadata(newMetadata);

                    console.log(newMetadata);

                    return { ...currentMetadata };
                }}
                addMethod={addMethod}
                setNewCollectionMsg={setNewCollectionMsg}
                newCollectionMsg={newCollectionMsg}
            />
        </>,
        disabled: !(getMetadataForBadgeId(id, individualBadgeMetadata).name) || disabled
    }
}