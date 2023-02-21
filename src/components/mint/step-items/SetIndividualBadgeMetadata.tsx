import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { BadgeMetadata, BitBadgeCollection, MetadataAddMethod } from "../../../bitbadges-api/types";
import { Button, Divider, InputNumber } from "antd";
import { BadgeAvatarDisplay } from "../../common/BadgeAvatarDisplay";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../../constants";
import { getBlankBalance } from "../../../bitbadges-api/balances";
import { MetadataForm } from "../form-items/MetadataForm";
import { useEffect, useState } from "react";

export function SetIndividualBadgeMetadataStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (msg: MessageMsgNewCollection) => void,
    collection: BitBadgeCollection,
    individualBadgeMetadata: { [badgeId: string]: BadgeMetadata },
    setIndividualBadgeMetadata: (metadata: { [badgeId: string]: BadgeMetadata }) => void,
    collectionMetadata: BadgeMetadata,
    addMethod: MetadataAddMethod,
) {
    const [id, setId] = useState(1);


    return {
        title: 'Set Individual Badge Metadata',
        description: '',
        node: <>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: PRIMARY_TEXT }} >
                <div>Currently Setting Metadata for Badge ID:{' '}</div>
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

            <br />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ maxWidth: 700, color: PRIMARY_TEXT }}>
                    <BadgeAvatarDisplay
                        collection={{
                            ...collection,
                            collectionMetadata: collectionMetadata,
                            badgeMetadata: individualBadgeMetadata
                        }}
                        userBalance={getBlankBalance()}
                        startId={1}
                        endId={Object.keys(individualBadgeMetadata).length}
                        selectedId={id}
                        size={40}
                        showIds={true}

                    />
                </div>
            </div>
            <br />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Button style={{ backgroundColor: 'transparent', color: PRIMARY_TEXT, margin: 20 }}
                    onClick={() => {
                        let newMetadata = { ...individualBadgeMetadata };
                        for (const key of Object.keys(newMetadata)) {
                            newMetadata[key] = collectionMetadata;
                        }

                        setIndividualBadgeMetadata(newMetadata);
                    }}>Populate All with Collection Metadata</Button>
                <Button
                    style={{ backgroundColor: 'transparent', color: PRIMARY_TEXT, margin: 20 }}
                    onClick={() => {
                        let newMetadata = { ...individualBadgeMetadata };
                        for (const key of Object.keys(newMetadata)) {
                            newMetadata[key] = individualBadgeMetadata[id];
                        }

                        setIndividualBadgeMetadata(newMetadata);
                    }}>{`Populate All with This Badge's Current Metadata (ID: ${id})`}</Button>
            </div>

            <Divider />

            <MetadataForm
                id={id}
                metadata={individualBadgeMetadata}
                setMetadata={setIndividualBadgeMetadata as any}
                addMethod={addMethod}
                setNewCollectionMsg={setNewCollectionMsg}
                newCollectionMsg={newCollectionMsg}
            />
        </>,
        disabled: !(individualBadgeMetadata[id]?.name)
    }
}