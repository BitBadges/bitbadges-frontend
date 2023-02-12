import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { BadgeMetadata, BitBadgeCollection, MetadataAddMethod } from "../../../bitbadges-api/types";
import { Button, Divider, InputNumber } from "antd";
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../../constants";
import { getBlankBalance } from "../../../bitbadges-api/balances";
import { MetadataForm } from "../form-items/MetadataForm";
import { useState } from "react";

export function SetIndividualBadgeMetadataStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (msg: MessageMsgNewCollection) => void,
    collection: BitBadgeCollection,
    individualBadgeMetadata: BadgeMetadata[],
    setIndividualBadgeMetadata: (metadata: BadgeMetadata[]) => void,
    collectionMetadata: BadgeMetadata,
    addMethod: MetadataAddMethod,
    setAddMethod: (method: MetadataAddMethod) => void,
    hackyUpdatedFlag: boolean,

) {
    const [id, setId] = useState(0);

    return {
        title: 'Set Individual Badge Metadata',
        description: '',
        node: <>
            <div>
                Currently Setting Metadata for Badge ID:{' '}
                <InputNumber min={0} max={individualBadgeMetadata.length - 1}
                    value={id}
                    onChange={(e) => setId(e)}
                    style={{
                        backgroundColor: PRIMARY_BLUE,
                        color: PRIMARY_TEXT,
                    }}
                />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ maxWidth: 700, color: PRIMARY_TEXT }}>
                    <BadgeAvatarDisplay
                        badgeCollection={collection}
                        setBadgeCollection={() => { }}
                        userBalance={getBlankBalance()}
                        startId={0}
                        endId={individualBadgeMetadata.length - 1}
                        selectedId={id}
                        size={40}
                        hackyUpdatedFlag={hackyUpdatedFlag}
                        showIds={true}
                    />
                </div>
            </div>
            <br />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Button style={{ backgroundColor: 'transparent', color: PRIMARY_TEXT, margin: 20 }}
                    onClick={() => {
                        setIndividualBadgeMetadata(individualBadgeMetadata.map((x) => collectionMetadata));
                    }}>Populate All with Collection Metadata</Button>
                <Button style={{ backgroundColor: 'transparent', color: PRIMARY_TEXT, margin: 20 }}
                    onClick={() => {
                        setIndividualBadgeMetadata(individualBadgeMetadata.map((x) => individualBadgeMetadata[0]));
                    }}>Populate All with Badge ID 0s Metadata</Button>
            </div>
            <Divider />

            <MetadataForm
                id={id}
                metadata={individualBadgeMetadata}
                setMetadata={setIndividualBadgeMetadata as any}
                addMethod={addMethod}
                setAddMethod={setAddMethod}
                setNewCollectionMsg={setNewCollectionMsg}
                newCollectionMsg={newCollectionMsg}
            />
        </>,
        disabled: !(individualBadgeMetadata[id]?.name)
    }
}