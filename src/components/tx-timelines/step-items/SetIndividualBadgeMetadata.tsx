import { InputNumber } from "antd";
import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { useState } from "react";
import { getBlankBalance } from "../../../bitbadges-api/balances";
import { BadgeMetadata, BadgeMetadataMap, BitBadgeCollection, MetadataAddMethod } from "../../../bitbadges-api/types";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../../constants";
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
) {
    const [id, setId] = useState(1);
    const [disabled, setDisabled] = useState(false);

    return {
        title: 'Set Individual Badge Metadata',
        description: '',
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
                <InputNumber min={1} max={Object.keys(individualBadgeMetadata).length}
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
                metadata={individualBadgeMetadata[id]}
                setMetadata={(metadata: BadgeMetadata) => {
                    console.log(metadata);
                    setDisabled(true);
                    individualBadgeMetadata[id] = metadata;
                    console.log("BEFORE")
                    console.time("SET");
                    setIndividualBadgeMetadata(individualBadgeMetadata);
                    setDisabled(false);
                    console.log("AGET");
                    console.timeEnd("SET");
                }}
                populateAllWithCollectionMetadata={() => {
                    let newMetadata: BadgeMetadataMap = {

                    };
                    for (const key of Object.keys(individualBadgeMetadata)) {
                        newMetadata[key] = collectionMetadata;
                    }

                    setIndividualBadgeMetadata(newMetadata);

                    return collectionMetadata;
                }}
                populateAllWithCurrentMetadata={() => {
                    let newMetadata: BadgeMetadataMap = {};
                    for (const key of Object.keys(individualBadgeMetadata)) {
                        newMetadata[key] = individualBadgeMetadata[id];
                    }

                    setIndividualBadgeMetadata(newMetadata);
                }}
                addMethod={addMethod}
                setNewCollectionMsg={setNewCollectionMsg}
                newCollectionMsg={newCollectionMsg}
            />
        </>,
        disabled: !(individualBadgeMetadata[id]?.name) || disabled
    }
}